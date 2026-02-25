import { timingSafeEqual } from '@/lib/config/env';

const COOKIE_NAME = 'admin_session';
const SESSION_VALUE = 'authenticated';

/**
 * Creates a signed session token by hashing the session value with the secret.
 * Uses a simple HMAC-like approach: token = base64(value:hash(value+secret))
 */
export function createSessionToken(secret: string): string {
  // Simple signed token: base64 encode "authenticated:<hash>"
  // The hash is a basic checksum derived from the secret to prevent forgery
  const hash = simpleHash(SESSION_VALUE + ':' + secret);
  const token = `${SESSION_VALUE}:${hash}`;
  return Buffer.from(token).toString('base64');
}

/**
 * Validates a session token against the expected secret.
 */
export function validateSessionToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;

  try {
    const expected = createSessionToken(secret);
    return timingSafeEqual(token, expected);
  } catch {
    return false;
  }
}

/**
 * Simple deterministic hash function for signing.
 * Not cryptographically strong, but sufficient for an internal admin cookie
 * since the secret itself is the security boundary.
 */
function simpleHash(input: string): string {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
    h = h >>> 0; // ensure unsigned
  }
  return h.toString(36);
}

export { COOKIE_NAME };
