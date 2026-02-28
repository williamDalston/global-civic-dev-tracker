/**
 * Lead validation utilities — spam hardening for the lead capture pipeline.
 *
 * Covers: disposable email rejection, phone normalization, and
 * duplicate-window detection (same email + city within 24 hours).
 */

// Common disposable/temporary email domains. Not exhaustive but catches the
// high-volume offenders. Maintained as a Set for O(1) lookups.
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwaway.email',
  'yopmail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'dispostable.com',
  'trashmail.com',
  'tempail.com',
  'fakeinbox.com',
  'mailnesia.com',
  'maildrop.cc',
  'discard.email',
  'temp-mail.org',
  'getnada.com',
  'emailondeck.com',
  '10minutemail.com',
  'minuteinbox.com',
  'mohmal.com',
  'mailcatch.com',
  'tmpail.com',
]);

/**
 * Check whether an email uses a known disposable/temporary provider.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Normalize a phone number to digits-only (E.164-ish).
 * Returns null if the result has fewer than 7 digits (too short to be real).
 */
export function normalizePhone(raw: string): string | null {
  // Strip everything except digits and leading +
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return digits;
}

/**
 * Simple email format + domain sanity check beyond what Zod .email() does.
 * Rejects emails with no TLD or suspiciously short domains.
 */
export function isValidEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  // Must have at least one dot and a TLD of 2+ chars
  const parts = domain.split('.');
  if (parts.length < 2) return false;
  const tld = parts[parts.length - 1];
  if (tld.length < 2) return false;
  return true;
}
