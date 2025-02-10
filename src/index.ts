import { Hono } from 'hono';
import { setupMiddleware } from './middleware';
import routes from './routes';
import { connectDB, closeDB } from './config/db';
import { getServerInfo } from './utils/serverInfo';
import { errorHandler } from './middleware/logger';
import notFound from 'stoker/middlewares/not-found';
import * as Sentry from '@sentry/bun';
import envValidator from './config/env';

const app = new Hono();

const initializeServices = () => {
  try {
    envValidator.validateEnvVars();

    setupMiddleware(app);

    app.route('/', routes);
    app.notFound(notFound);
    app.onError(errorHandler());

    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log('Shutting down server...');
  try {
    await closeDB();
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  process.exit(0);
};

// Error Handlers
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

const startServer = async () => {
  try {
    initializeServices();

    await connectDB();

    const port = parseInt(Bun.env.PORT || '5000');

    console.log(`Server is running on port ${port}`);
    getServerInfo();
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
