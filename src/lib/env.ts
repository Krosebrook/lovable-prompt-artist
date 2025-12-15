import { z } from "zod";

// Environment variable schema
const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "Supabase key is required"),
  VITE_SUPABASE_PROJECT_ID: z.string().optional(),
  MODE: z.enum(["development", "production", "test"]).default("development"),
});

type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

/**
 * Validates and returns environment variables
 * Throws an error if required variables are missing
 */
export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const rawEnv = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    MODE: import.meta.env.MODE,
  };

  const result = EnvSchema.safeParse(rawEnv);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return getEnv().MODE === "production";
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return getEnv().MODE === "development";
}

/**
 * Check if we're in test mode
 */
export function isTest(): boolean {
  return getEnv().MODE === "test";
}

/**
 * Get the Supabase URL
 */
export function getSupabaseUrl(): string {
  return getEnv().VITE_SUPABASE_URL;
}

/**
 * Get the Supabase public key
 */
export function getSupabaseKey(): string {
  return getEnv().VITE_SUPABASE_PUBLISHABLE_KEY;
}
