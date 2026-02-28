import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  isDisposableEmail,
  normalizePhone,
  isValidEmailDomain,
} from '@/lib/utils/lead-validation';

// Replicate the schema from the leads capture route (with consent field)
const leadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(30).optional(),
  message: z.string().max(2000).optional(),
  workType: z.string().max(100).optional(),
  permitId: z.number().optional(),
  citySlug: z.string().max(100).optional(),
  sourceUrl: z.string().url().max(2000).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  consent: z.boolean(),
  website: z.string().max(0).optional(),
});

describe('lead capture schema validation', () => {
  it('accepts valid lead with all fields', () => {
    const result = leadSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      message: 'Need a contractor',
      workType: 'renovation',
      citySlug: 'washington-dc',
      consent: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal lead (name + email + consent)', () => {
    const result = leadSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
      consent: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing consent field', () => {
    const result = leadSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = leadSchema.safeParse({
      name: '',
      email: 'test@example.com',
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = leadSchema.safeParse({
      name: 'Test',
      email: 'not-an-email',
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects honeypot with content', () => {
    const result = leadSchema.safeParse({
      name: 'Bot',
      email: 'bot@spam.com',
      consent: true,
      website: 'http://spam.com',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty honeypot field', () => {
    const result = leadSchema.safeParse({
      name: 'Real Person',
      email: 'real@example.com',
      consent: true,
      website: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects name exceeding 200 chars', () => {
    const result = leadSchema.safeParse({
      name: 'A'.repeat(201),
      email: 'test@example.com',
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects message exceeding 2000 chars', () => {
    const result = leadSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      consent: true,
      message: 'X'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('citySlug is optional — missing is valid', () => {
    const result = leadSchema.safeParse({
      name: 'No City',
      email: 'nocity@example.com',
      consent: true,
    });
    expect(result.success).toBe(true);
    expect(result.data?.citySlug).toBeUndefined();
  });
});

describe('disposable email detection', () => {
  it('detects known disposable domains', () => {
    expect(isDisposableEmail('test@mailinator.com')).toBe(true);
    expect(isDisposableEmail('test@guerrillamail.com')).toBe(true);
    expect(isDisposableEmail('test@yopmail.com')).toBe(true);
    expect(isDisposableEmail('test@tempmail.com')).toBe(true);
  });

  it('allows legitimate email domains', () => {
    expect(isDisposableEmail('user@gmail.com')).toBe(false);
    expect(isDisposableEmail('user@outlook.com')).toBe(false);
    expect(isDisposableEmail('user@company.co.uk')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(isDisposableEmail('noatsign')).toBe(false);
    expect(isDisposableEmail('')).toBe(false);
  });
});

describe('phone number normalization', () => {
  it('normalizes US phone formats', () => {
    expect(normalizePhone('(555) 123-4567')).toBe('5551234567');
    expect(normalizePhone('555.123.4567')).toBe('5551234567');
    expect(normalizePhone('555 123 4567')).toBe('5551234567');
  });

  it('normalizes international numbers', () => {
    expect(normalizePhone('+1-555-123-4567')).toBe('15551234567');
    expect(normalizePhone('+44 20 7946 0958')).toBe('442079460958');
  });

  it('rejects too-short numbers', () => {
    expect(normalizePhone('123')).toBeNull();
    expect(normalizePhone('12')).toBeNull();
  });

  it('rejects too-long numbers', () => {
    expect(normalizePhone('1234567890123456')).toBeNull();
  });

  it('handles empty/whitespace input', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('   ')).toBeNull();
  });
});

describe('email domain validation', () => {
  it('accepts valid domains', () => {
    expect(isValidEmailDomain('test@gmail.com')).toBe(true);
    expect(isValidEmailDomain('test@company.co.uk')).toBe(true);
    expect(isValidEmailDomain('test@sub.domain.org')).toBe(true);
  });

  it('rejects domains without TLD', () => {
    expect(isValidEmailDomain('test@localhost')).toBe(false);
  });

  it('rejects single-char TLDs', () => {
    expect(isValidEmailDomain('test@domain.a')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(isValidEmailDomain('nodomain')).toBe(false);
    expect(isValidEmailDomain('')).toBe(false);
  });
});
