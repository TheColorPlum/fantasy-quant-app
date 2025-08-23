import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a UUID v4 request ID
 */
function generateRequestId(): string {
  return uuidv4();
}

/**
 * Logs structured data to console
 */
function log(level: 'info' | 'error' | 'warn', data: Record<string, any>) {
  const logEntry = {
    level,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  if (level === 'error') {
    console.error(logEntry);
  } else {
    console.log(logEntry);
  }
}

/**
 * Higher-order function that wraps API route handlers with request logging and ID tracking
 * Adds x-request-id header to responses and logs request lifecycle
 */
export function withRequestId<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    // Generate or use existing request ID
    const requestId = req.headers.get('x-request-id') || generateRequestId();
    const startTime = Date.now();

    // Log request start
    log('info', {
      message: 'Request started',
      requestId,
      method: req.method,
      url: req.url
    });

    try {
      // Execute the original handler
      const response = await handler(req, ...args);
      
      // Add request ID to response headers
      response.headers.set('x-request-id', requestId);
      
      // Log successful completion
      const durationMs = Date.now() - startTime;
      log('info', {
        message: 'Request completed',
        requestId,
        status: response.status,
        durationMs
      });

      return response;

    } catch (error) {
      // Log error
      const durationMs = Date.now() - startTime;
      log('error', {
        message: 'Request failed',
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs
      });

      // Return 500 error response with request ID
      const errorResponse = NextResponse.json({
        error: 'Internal server error'
      }, { status: 500 });
      
      errorResponse.headers.set('x-request-id', requestId);
      return errorResponse;
    }
  };
}