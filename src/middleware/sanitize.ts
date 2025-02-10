import { MiddlewareHandler, Context, Next } from 'hono';
import sanitize from 'mongo-sanitize';

/**
 * Middleware to sanitize request body, query, and params.
 */
export const sanitizeMiddleware: MiddlewareHandler = async (
  c: Context,
  next: Next
) => {
  if (
    c.req.method === 'POST' ||
    c.req.method === 'PUT' ||
    c.req.method === 'PATCH'
  ) {
    const body = await c.req.json();
    c.req.json = async () => sanitize(body);
  }

  const query = c.req.queries();
  Object.keys(query).forEach((key) => {
    query[key] = sanitize(query[key]);
  });

  await next();
};
