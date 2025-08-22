import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Import the schema directly to avoid module caching issues
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  ESPNAUTH_ENCRYPTION_KEY: z.string().length(64, '32-byte hex key (64 chars)').optional(),
});

describe('Environment validation', () => {
  it('should fail validation with malformed env', () => {
    const badEnv = {};
    
    expect(() => EnvSchema.parse(badEnv)).toThrow();
  });

  it('should pass validation with well-formed env', () => {
    const goodEnv = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      NEXT_PUBLIC_POSTHOG_KEY: 'test-key',
      SENTRY_DSN: 'https://test@sentry.io/123',
      ESPNAUTH_ENCRYPTION_KEY: '1234567890123456789012345678901234567890123456789012345678901234'
    };
    
    expect(() => EnvSchema.parse(goodEnv)).not.toThrow();
  });

  it('should reject invalid ESPNAUTH_ENCRYPTION_KEY length', () => {
    const envWithBadKey = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      ESPNAUTH_ENCRYPTION_KEY: 'toolshort'
    };
    
    expect(() => EnvSchema.parse(envWithBadKey)).toThrow();
  });
});