import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(1).optional(),
  REVALIDATION_SECRET: z.string().min(1).optional(),
  INDEXNOW_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  ETL_DEBUG: z.string().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let _validated = false;

export function validateEnv() {
  if (_validated) return;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.warn(`[env] Invalid environment variables:\n${formatted}`);
  }
  _validated = true;
}

/**
 * Timing-safe string comparison to prevent timing attacks on secret verification.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let result = a.length ^ b.length; // non-zero if lengths differ
  for (let i = 0; i < maxLen; i++) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return result === 0;
}

/**
 * Verify a bearer token against an expected secret using timing-safe comparison.
 * Returns true if the secret is not configured (allows passthrough in dev) or if valid.
 */
export function verifyAuth(
  authHeader: string | null,
  secretEnvVar: string | undefined
): boolean {
  if (!secretEnvVar) return false;
  if (!authHeader) return false;

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;
  return timingSafeEqual(token, secretEnvVar);
}
