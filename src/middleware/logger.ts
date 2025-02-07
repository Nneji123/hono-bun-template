import { Logtail } from "@logtail/node";
import { Context } from 'hono';
import { EmailNotificationService } from "../services/email";

if (!Bun.env.LOGTAIL_SOURCE_TOKEN) {
    console.warn(
        "LOGTAIL_SOURCE_TOKEN is not set.  Logging to Logtail will be skipped. " +
        "Set this environment variable to your Logtail source token."
    );
}

const logtail = Bun.env.LOGTAIL_SOURCE_TOKEN
    ? new Logtail(Bun.env.LOGTAIL_SOURCE_TOKEN)
    : null;

export const logtailLogger = (message: string, ...rest: (string | Context)[]) => {
    console.log(message, ...rest.filter(item => typeof item === 'string'));

    if (!logtail) {
        return;
    }

    const context = rest.find(item => typeof item === 'object' && 'req' in item && 'res' in item) as Context | undefined;

    if (!context) {
        logtail.log(message).catch(handleLogtailError);
        return;
    }

    const nodeEnv = Bun.env.NODE_ENV || 'development';

    // Corrected helper function to convert Headers to a plain object
    const headersToObject = (headers: Headers): Record<string, string> => {
      const obj: Record<string, string> = {};
      for (const [key, value] of (headers as any).entries()) { // Type assertion
          obj[key] = value;
      }
      return obj;
  };


    const logEntry = {
        message: message,
        node_env: nodeEnv,
        request: {
            body: context.req.parseBody || {},
            headers: headersToObject(context.req.raw.headers), // Use helper function
            ip: (context.req as any).ip,  // Type assertion for 'ip'
            method: context.req.method,
            params: context.req.param() || {},
            query: context.req.query() || {},
            url: context.req.url,
            userAgent: context.req.header('user-agent'),
        },
        response: {
            body: context.res.body,  // Note: Might not be available after response
            headers: headersToObject(context.res.headers), // Use helper function
            responseTime: context.get('responseTime') ? `${context.get('responseTime')}ms` : undefined,
            statusCode: context.res.status,
        },
        timestamp: new Date().toISOString(),
    };

    logtail.log(message, "info", logEntry).catch(handleLogtailError);
};

function handleLogtailError(error: any) {
    console.error("Error sending log to Logtail:", error);
}

export const logtailFlush = async () => {
    if (logtail) {
        await logtail.flush();
    }
};

// --- Error Handling with Email ---
export const handleErrorWithEmail = async (err: Error, c: Context) => {
    logtailLogger(`Error: ${err.message}`, c); // Log the error

    const formatStackTrace = (stack: string | undefined) => {
        if (!stack) return 'No stack trace available.';
        return stack.split('\n').map(line => line.trim()).join('\n');
    };
    const formattedStack = formatStackTrace(err.stack);
    const timestamp = new Date().toISOString();

    try {
        const emailService = new EmailNotificationService();
          // Corrected helper function (same as above)
          const headersToObject = (headers: Headers): Record<string, string> => {
            const obj: Record<string, string> = {};
            for (const [key, value] of (headers as any).entries()) { // Type assertion
                obj[key] = value;
            }
            return obj;
        };

        const requestDetails = {
            method: c.req.method,
            url: c.req.url,
            headers: headersToObject(c.req.raw.headers), // Use the same helper
            body: c.req.parseBody || {},
            query: c.req.query()
        };

        const emailContext = {
            errorCode: (c.res as any).response_code, // Type assertion
            errorMessage: err.message,
            timestamp: timestamp,
            stackTrace: formattedStack,
            requestMethod: requestDetails.method,
            requestUrl: requestDetails.url,
            requestHeaders: requestDetails.headers,
            requestBody: requestDetails.body,
            requestQuery: requestDetails.query
        };


        await emailService.sendEmail(
            "Application Error",
            "server-error",
            Bun.env.ERROR_NOTIFICATION_EMAIL || "ifeanyinneji777@gmail.com",
            emailContext,
            []
        );
        console.log("Error notification email sent.");

    } catch (emailError) {
        console.error("Error sending error notification email:", emailError);
    }
    return c.text('Internal Server Error', 500);
};