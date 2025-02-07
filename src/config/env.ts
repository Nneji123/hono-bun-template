const requiredEnvVars = {
    mandatory: [
      'NODE_ENV',
      'PORT',
      'JWT_SECRET',
      'ACCESS_TOKEN_EXPIRATION',
      'REFRESH_TOKEN_EXPIRATION',
      'ERROR_NOTIFICATION_EMAIL',
      'SENTRY_DSN',
      'LOGTAIL_SOURCE_TOKEN',
      'EMAIL_SERVICE_TYPE',
      'ERROR_NOTIFICATION_EMAIL'
    ],
    developmentOnly: [
      'DEV_MONGODB_URI',
      'DEFAULT_ADMIN_EMAIL',
      'DEFAULT_ADMIN_PASSWORD',
      'DEFAULT_ADMIN_FIRST_NAME',
      'DEFAULT_ADMIN_LAST_NAME',
      'DEFAULT_ADMIN_PHONE_NUMBER'
    ],
    productionOnly: ['PROD_MONGODB_URI'],
    emailServiceSpecific: {
      smtp: [
        'SMTP_CC_EMAIL',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASSWORD',
        'SMTP_FROM_NAME'
      ],
      resend: ['RESEND_API_KEY', 'RESEND_FROM_NAME', 'RESEND_FROM_EMAIL'],
      zeptomail: [
        'ZEPTOMAIL_API_KEY',
        'ZEPTOMAIL_EMAIL_ADDRESS',
        'ZEPTOMAIL_EMAIL_NAME'
      ]
    },
    optional: [] // Add this line to define the optional properties
  };
  
  const validateEnvVars = (): void => {
    const missingMandatoryVars = requiredEnvVars.mandatory.filter(
      (envVar) => !Bun.env[envVar]
    );
  
    if (missingMandatoryVars.length > 0) {
      throw new Error(
        `Missing mandatory environment variables: ${missingMandatoryVars.join(', ')}`
      );
    }
  
    if (Bun.env.NODE_ENV === 'development') {
      const missingDevelopmentVars = requiredEnvVars.developmentOnly.filter(
        (envVar) => !Bun.env[envVar]
      );
  
      if (missingDevelopmentVars.length > 0) {
        throw new Error(
          `Missing development-specific environment variables: ${missingDevelopmentVars.join(', ')}`
        );
      }
    }
  
    if (Bun.env.NODE_ENV === 'production') {
      const missingProductionVars = requiredEnvVars.productionOnly.filter(
        (envVar) => !Bun.env[envVar]
      );
  
      if (missingProductionVars.length > 0) {
        throw new Error(
          `Missing production-specific environment variables: ${missingProductionVars.join(', ')}`
        );
      }
  
      // Ensure at least one email service configuration is set based on the EMAIL_SERVICE_TYPE
      const emailServiceType = Bun.env.EMAIL_SERVICE_TYPE as keyof typeof requiredEnvVars.emailServiceSpecific;
      const requiredEmailVars = requiredEnvVars.emailServiceSpecific[emailServiceType];
  
      if (emailServiceType && requiredEmailVars) {
        const missingEmailVars = requiredEmailVars.filter(
          (envVar) => !Bun.env[envVar]
        );
  
        if (missingEmailVars.length > 0) {
          throw new Error(
            `Missing email service-specific environment variables: ${missingEmailVars.join(', ')}`
          );
        }
      } else {
        throw new Error('Invalid or missing EMAIL_SERVICE_TYPE configuration');
      }
    }
  
    // Check for any missing optional environment variables
    const missingOptionalVars = requiredEnvVars.optional.filter(
      (envVar) => !Bun.env[envVar]
    );
  
    if (missingOptionalVars.length > 0) {
      console.warn(
        `Warning: Missing optional environment variables: ${missingOptionalVars.join(', ')}`
      );
    }
  };
  
  export default { validateEnvVars };
  