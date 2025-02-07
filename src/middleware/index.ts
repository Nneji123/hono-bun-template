import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';
import { logger } from 'hono/logger';
import { etag } from 'hono/etag';
import { serveStatic } from 'hono/bun';
import * as Sentry from '@sentry/bun';
import { logtailLogger } from './logger';
import { bodyLimit } from "hono/body-limit";
import { requestId } from 'hono/request-id'

// --- Sentry Setup (if using) ---
export function setupSentry() {
    if (Bun.env.SENTRY_DSN) {
        Sentry.init({
            dsn: Bun.env.SENTRY_DSN,
            // Additional Sentry options (tracesSampleRate, etc.)
        });
        console.log('Sentry initialized.');
    } else {
        console.warn('SENTRY_DSN environment variable not set. Sentry is disabled.');
    }
}

// --- Main Middleware Function ---

export function setupMiddleware(app: Hono) {
    // Error handling MUST be first
    if (Bun.env.SENTRY_DSN) {
      app.use('*', async (c, next) => {
        try {
            await next()
        } catch (error) {
            Sentry.captureException(error)
            throw error; // Re-throw to allow Hono's default error handling
        }
      });
    }


    // Security-related middleware
    app.use('*', secureHeaders());  // Add secure headers
    app.use('*', cors()); // Enable CORS (configure as needed)
     // Add more specific CORS configuration if needed, e.g.,
     /*
      app.use('*', cors({
          origin: ['https://example.com', 'https://api.example.com'],
          allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
          allowHeaders: ['Content-Type', 'Authorization'],
          credentials: true,
      }));
      */

    // Other middleware
    app.use('*', requestId())
    app.use('*', logger(logtailLogger));
    app.use('*', prettyJSON());
    app.use('*', etag());
    app.use('*', bodyLimit({
        maxSize: 1024 * 1024 * 50, // 50MB limit in bytes
    }));
    // Favicon (using serveStatic, best approach in Hono)
    app.get('/favicon.ico', serveStatic({ path: '../public/favicon.ico' }));

    // Static file serving
    app.use('/static/*', serveStatic({ root: './public' }));
}