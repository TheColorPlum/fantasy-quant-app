import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

describe('getSessionUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should return null when no cookie is present', async () => {
    // Mock next/headers
    vi.doMock('next/headers', () => ({
      cookies: vi.fn(() => ({
        get: vi.fn().mockReturnValue(undefined)
      }))
    }));

    // Mock Supabase client
    vi.doMock('@supabase/ssr', () => ({
      createServerClient: vi.fn(() => ({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null
          })
        }
      }))
    }));
    
    const { getSessionUser } = await import('../../lib/auth');
    const result = await getSessionUser();
    
    expect(result).toBeNull();
  });

  it('should return user when valid session exists', async () => {
    // Mock next/headers
    vi.doMock('next/headers', () => ({
      cookies: vi.fn(() => ({
        get: vi.fn().mockReturnValue({ value: 'valid-session-token' })
      }))
    }));

    // Mock Supabase client with valid user
    vi.doMock('@supabase/ssr', () => ({
      createServerClient: vi.fn(() => ({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { 
              user: { 
                id: 'test-user-id',
                email: 'test@example.com'
              }
            },
            error: null
          })
        }
      }))
    }));
    
    const { getSessionUser } = await import('../../lib/auth');
    const result = await getSessionUser();
    
    expect(result).toEqual({
      id: 'test-user-id',
      email: 'test@example.com'
    });
  });
});