import { Context, Next } from 'hono';
import { pinoLogger } from 'hono-pino';
import pino from 'pino';
import dayjs from 'dayjs';
import { EmailNotificationService } from '../services/email.service';
import * as HttpStatusCodes from 'stoker/http-status-codes';

// Types remain the same
interface RequestData {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
}

interface ResponseData {
  statusCode: number;
  headers: Record<string, string>;
  body?: unknown;
  responseTime: number;
}

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'apiKey',
  'api_key',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'ssn',
  'accessToken',
  'refreshToken',
  'phoneNumber',
  'email',
  'address'
];

// Create default logger
const createDefaultLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  const transport = isProduction
    ? {
        target: '@logtail/pino',
        options: {
          sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
          endpoint: 'https://in.logs.betterstack.com'
        }
      }
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      };

  return pino({
    level: isProduction ? 'info' : 'debug',
    transport
  });
};

// Create a singleton instance of the default logger
const defaultLogger = createDefaultLogger();

// Utility functions (sanitizeData, formatStackTrace remain the same)
const sanitizeData = (data: unknown): unknown => {
  if (!data) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const sanitized: Record<string, unknown> = {};
  Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (
      SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))
    ) {
      sanitized[key] = '***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  });
  return sanitized;
};

const formatStackTrace = (stack?: string): string => {
  if (!stack) return 'No stack trace available';

  const lines = stack.split('\n');
  const formattedLines = lines.map((line) => {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      const [_, functionName, filePath, lineNumber, columnNumber] = match;
      return {
        function: functionName,
        file: filePath.split('/').pop(),
        path: filePath,
        line: lineNumber,
        column: columnNumber
      };
    }
    return line;
  });

  let formatted = `${formattedLines[0]}\n`;
  formattedLines.slice(1).forEach((line) => {
    if (typeof line === 'object') {
      formatted += `→ ${line.function}\n`;
      formatted += `  File: ${line.file}\n`;
      formatted += `  Line: ${line.line}\n`;
      formatted += `  Path: ${line.path}\n\n`;
    } else {
      formatted += `${line}\n`;
    }
  });

  return formatted;
};

const getRequestData = (c: Context): RequestData => {
  return {
    method: c.req.method,
    url: c.req.url,
    headers: sanitizeData(c.req.header()) as Record<string, string>,
    query: sanitizeData(
      Object.fromEntries(new URL(c.req.url).searchParams)
    ) as Record<string, string>,
    body: sanitizeData(c.req.parseBody() as any)
  };
};

const getResponseData = async (
  c: Context,
  startTime: number
): Promise<ResponseData> => {
  const responseTime = Date.now() - startTime;
  let responseBody;

  try {
    const contentType = c.res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      responseBody = await c.res.clone().json();
    } else if (contentType?.includes('text')) {
      responseBody = await c.res.clone().text();
    }
  } catch (error) {
    responseBody = '[Unparseable Response]';
  }

  return {
    statusCode: c.res.status,
    headers: sanitizeData(Object.fromEntries(c.res.headers)) as Record<
      string,
      string
    >,
    body: sanitizeData(responseBody),
    responseTime
  };
};

// Logger middleware
export const loggerMiddleware = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  const transport = isProduction
    ? {
        target: '@logtail/pino',
        options: {
          sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
          endpoint: 'https://in.logs.betterstack.com'
        }
      }
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      };

  // Initialize hono-pino middleware
  const middleware = pinoLogger({
    pino: {
      level: isProduction ? 'info' : 'debug',
      transport
    }
  });

  return async (c: Context, next: Next) => {
    const startTime = Date.now();

    // Initialize logger if not present
    if (!c.var.logger) {
      c.set('logger', defaultLogger);
    }

    // Add custom properties
    const requestData = getRequestData(c);
    const contextData = {
      environment: process.env.NODE_ENV,
      correlationId: c.req.header('x-correlation-id'),
      userAgent: c.req.header('user-agent'),
      request: requestData
    };

    // c.var.logger = c.var.logger.child(contextData);

    try {
      await middleware(c, next);

      const responseData = await getResponseData(c, startTime);
      const status = c.res.status;

      const logData = {
        response: responseData,
        responseTime: Date.now() - startTime
      };

      if (status >= 500) {
        c.var.logger.error(logData, 'Server error response');
      } else if (status >= 400) {
        c.var.logger.warn(logData, 'Client error response');
      } else {
        c.var.logger.info(logData, 'Successful response');
      }
    } catch (error) {
      const responseData = await getResponseData(c, startTime);
      c.var.logger.error(
        {
          response: responseData,
          error,
          responseTime: Date.now() - startTime
        },
        'Request failed'
      );
      throw error;
    }
  };
};

// Error handler
export const errorHandler = () => {
  const emailService = new EmailNotificationService();

  return async (err: Error, c: Context) => {
    // Ensure we have a logger
    const logger = c.var.logger || defaultLogger;

    try {
      logger.error({
        err,
        request: getRequestData(c),
        message: 'Unhandled server error'
      });

      const context = {
        errorCode: c.res.status || 500,
        errorMessage: err.message,
        timestamp: dayjs().format('MMMM D, YYYY, h:mm:ss A'),
        stackTrace: formatStackTrace(err.stack),
        ...getRequestData(c)
      };

      await emailService.sendEmail(
        'Application Error',
        'server-error',
        Bun.env.ERROR_NOTIFICATION_EMAIL || 'ifeanyinneji777@gmail.com',
        context,
        []
      );

      return c.json(
        {
          status: false,
          message:
            process.env.NODE_ENV === 'production'
              ? 'An internal server error occurred'
              : err.message,
          response_code: c.res.status || 500
        },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    } catch (emailError) {
      logger.error({
        err: emailError,
        message: 'Failed to send error notification email'
      });

      return c.json(
        {
          status: false,
          message: 'An internal server error occurred',
          response_code: 500
        },
        500
      );
    }
  };
};
