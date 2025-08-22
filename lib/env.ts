import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  ESPNAUTH_ENCRYPTION_KEY: z.string().length(64, '32-byte hex key (64 chars)').optional(),
});

export const env = EnvSchema.parse(process.env);