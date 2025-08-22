import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error("Environment validation failed:");
    console.error(result.error.format());
    throw new Error("Invalid environment variables");
  }
  
  return result.data;
}

export function validateServerEnv(): Env & { SUPABASE_SERVICE_ROLE_KEY: string } {
  const env = validateEnv();
  
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required in server context");
  }
  
  return {
    ...env,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}