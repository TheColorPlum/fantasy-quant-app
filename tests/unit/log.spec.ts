import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRequestId } from '@/lib/log';
import { NextRequest, NextResponse } from 'next/server';

describe('withRequestId', () => {
  let mockConsoleLog: ReturnType<typeof vi.spyOn>;
  let mockConsoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation();
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should add x-request-id header to response', async () => {
    const mockHandler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
    const wrappedHandler = withRequestId(mockHandler);

    const request = new NextRequest('http://localhost/test');
    const response = await wrappedHandler(request);

    expect(response.headers.get('x-request-id')).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    expect(mockHandler).toHaveBeenCalledWith(request);
  });

  it('should use existing x-request-id from request if present', async () => {
    const existingRequestId = 'existing-123';
    const mockHandler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
    const wrappedHandler = withRequestId(mockHandler);

    const request = new NextRequest('http://localhost/test', {
      headers: { 'x-request-id': existingRequestId }
    });
    const response = await wrappedHandler(request);

    expect(response.headers.get('x-request-id')).toBe(existingRequestId);
  });

  it('should log request start with request ID', async () => {
    const mockHandler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
    const wrappedHandler = withRequestId(mockHandler);

    const request = new NextRequest('http://localhost/test');
    await wrappedHandler(request);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'Request started',
        requestId: expect.any(String),
        method: 'GET',
        url: 'http://localhost/test',
        timestamp: expect.any(String)
      })
    );
  });

  it('should log request completion with timing', async () => {
    const mockHandler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true }, { status: 200 })
    );
    const wrappedHandler = withRequestId(mockHandler);

    const request = new NextRequest('http://localhost/test');
    await wrappedHandler(request);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'Request completed',
        requestId: expect.any(String),
        status: 200,
        durationMs: expect.any(Number),
        timestamp: expect.any(String)
      })
    );
  });

  it('should handle and log errors from wrapped handler', async () => {
    const testError = new Error('Test error');
    const mockHandler = vi.fn().mockRejectedValue(testError);
    const wrappedHandler = withRequestId(mockHandler);

    const request = new NextRequest('http://localhost/test');
    const response = await wrappedHandler(request);

    expect(response.status).toBe(500);
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: 'Request failed',
        requestId: expect.any(String),
        error: testError.message,
        timestamp: expect.any(String)
      })
    );
  });

  it('should return 500 error response when handler throws', async () => {
    const mockHandler = vi.fn().mockRejectedValue(new Error('Test error'));
    const wrappedHandler = withRequestId(mockHandler);

    const request = new NextRequest('http://localhost/test');
    const response = await wrappedHandler(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({
      error: 'Internal server error'
    });
  });
});