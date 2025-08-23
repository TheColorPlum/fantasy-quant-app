import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Sentry module
const mockCaptureException = vi.fn();
const mockInit = vi.fn();
const mockWithScope = vi.fn((callback) => {
  const mockScope = {
    setContext: vi.fn()
  };
  callback(mockScope);
});

vi.mock('@sentry/nextjs', () => ({
  captureException: mockCaptureException,
  init: mockInit,
  withScope: mockWithScope
}));

describe('Sentry integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env vars
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize when DSN is provided', async () => {
    process.env.SENTRY_DSN = 'https://test@sentry.io/123';
    
    // Import after setting env var
    const { initSentry } = await import('@/lib/sentry');
    
    await initSentry();
    
    expect(mockInit).toHaveBeenCalledWith({
      dsn: 'https://test@sentry.io/123',
      environment: 'test'
    });
  });

  it('should not initialize when DSN is absent', async () => {
    const { initSentry } = await import('@/lib/sentry');
    
    await initSentry();
    
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('should capture exceptions when DSN is provided', async () => {
    process.env.SENTRY_DSN = 'https://test@sentry.io/123';
    
    const { captureError } = await import('@/lib/sentry');
    const testError = new Error('Test error');
    
    await captureError(testError);
    
    expect(mockCaptureException).toHaveBeenCalledWith(testError);
  });

  it('should be a no-op when DSN is absent', async () => {
    const { captureError } = await import('@/lib/sentry');
    const testError = new Error('Test error');
    
    await captureError(testError);
    
    expect(mockCaptureException).not.toHaveBeenCalled();
  });
});