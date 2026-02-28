import { timingSafeEqual } from '@/lib/config/env';

const COOKIE_NAME = 'contractor_session';
const SESSION_PREFIX = 'contractor';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return timingSafeEqual(inputHash, hash);
}

export function createContractorSessionToken(contractorId: number, secret: string): string {
  const payload = `${SESSION_PREFIX}:${contractorId}:${Date.now()}`;
  const hash = simpleHash(payload + ':' + secret);
  const token = `${payload}:${hash}`;
  return Buffer.from(token).toString('base64');
}

export function validateContractorSessionToken(
  token: string,
  secret: string
): { valid: boolean; contractorId: number | null } {
  if (!token || !secret) return { valid: false, contractorId: null };

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 4 || parts[0] !== SESSION_PREFIX) {
      return { valid: false, contractorId: null };
    }

    const [prefix, contractorIdStr, timestamp, providedHash] = parts;
    const contractorId = parseInt(contractorIdStr, 10);

    if (isNaN(contractorId)) {
      return { valid: false, contractorId: null };
    }

    const payload = `${prefix}:${contractorIdStr}:${timestamp}`;
    const expectedHash = simpleHash(payload + ':' + secret);

    if (!timingSafeEqual(providedHash, expectedHash)) {
      return { valid: false, contractorId: null };
    }

    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    if (tokenAge > maxAge) {
      return { valid: false, contractorId: null };
    }

    return { valid: true, contractorId };
  } catch {
    return { valid: false, contractorId: null };
  }
}

function simpleHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
    h = h >>> 0;
  }
  return h.toString(36);
}

export function generateToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export { COOKIE_NAME };
