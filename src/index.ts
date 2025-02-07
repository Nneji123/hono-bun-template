import { Hono } from 'hono';
import { setupMiddleware } from './middleware';
import routes from './routes';
import { connectDB, closeDB } from './config/db';
import { getServerInfo } from './utils/serverInfo';
import { logtailFlush, handleErrorWithEmail } from './middleware/logger';
import { setupSentry } from './middleware';
import * as Sentry from '@sentry/bun';

const app = new Hono();

setupSentry();

setupMiddleware(app);

app.route('/', routes);

app.onError(handleErrorWithEmail);

// Graceful Shutdown
const shutdown = async () => {
    console.log('Shutting down server...');
    try {
        await logtailFlush();
        await closeDB();
    } catch (err) {
        console.error('Error during shutdown:', err);
    }
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    if (Bun.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
    shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason, promise);
      if (Bun.env.SENTRY_DSN) {
        Sentry.captureException(reason);
      }
    shutdown();
});

// Start the Server (after connecting to the database)
const startServer = async () => {
    try {
        await connectDB();
        const port = parseInt(Bun.env.PORT || '3000');
        const server = Bun.serve({
            port: port,
            fetch: app.fetch,
        });
        console.log(`Server is running on port ${port}`);
        getServerInfo();
    } catch (error) {
        console.error('Failed to start the server:', error);
        process.exit(1);
    }
};

startServer();
export default app;