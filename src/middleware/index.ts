import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';
import { etag } from 'hono/etag';
import { serveStatic } from 'hono/bun';
import { sentry } from '@hono/sentry';
import { bodyLimit } from 'hono/body-limit';
import { requestId } from 'hono/request-id';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { loggerMiddleware } from './logger';
import { poweredBy } from 'hono/powered-by';
import { sanitizeMiddleware } from './sanitize';

export function setupMiddleware(app: Hono) {
  app.use('*', loggerMiddleware());
  app.use('*', sentry({ dsn: Bun.env.SENTRY_DSN }));

  // Security-related middleware
  app.use(poweredBy({ serverName: 'Cedar' }));
  app.use('*', secureHeaders()); // Add secure headers
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
  app.use(sanitizeMiddleware);
  app.use('*', trimTrailingSlash());
  app.use('*', requestId());
  app.use('*', prettyJSON({ query: '' }));
  app.use('*', etag());
  app.use(
    '*',
    bodyLimit({
      maxSize: 1024 * 1024 * 50 // 50MB limit in bytes
    })
  );
  app.get('/favicon.ico', serveStatic({ path: '../public/favicon.ico' }));
  app.use('/static/*', serveStatic({ root: './public' }));
}
