/**
 * Optional Sentry integration for error tracking
 * Only initializes if SENTRY_DSN is provided in environment
 */

let sentryInitialized = false;

/**
 * Initialize Sentry if DSN is available
 */
export async function initSentry() {
  if (!process.env.SENTRY_DSN || sentryInitialized) {
    return;
  }

  try {
    const { init } = await import('@sentry/nextjs');
    init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development'
    });
    sentryInitialized = true;
  } catch (error) {
    // Sentry is optional, so we just warn if it fails
    console.warn('Failed to initialize Sentry:', error);
  }
}

/**
 * Capture error to Sentry if initialized, otherwise no-op
 */
export async function captureError(error: Error, context?: Record<string, any>) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    const { captureException, withScope } = await import('@sentry/nextjs');
    
    if (context) {
      withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
        captureException(error);
      });
    } else {
      captureException(error);
    }
  } catch (err) {
    // Sentry is optional, so we just warn if it fails
    console.warn('Failed to capture error to Sentry:', err);
  }
}