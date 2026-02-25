import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the schema from the leads capture route
const leadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(20).optional(),
  message: z.string().max(2000).optional(),
  workType: z.string().max(100).optional(),
  permitId: z.number().optional(),
  citySlug: z.string().max(100).optional(),
  sourceUrl: z.string().url().max(2000).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
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
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal lead (name + email only)', () => {
    const result = leadSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = leadSchema.safeParse({
      name: '',
      email: 'test@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = leadSchema.safeParse({
      name: 'Test',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects honeypot with content', () => {
    const result = leadSchema.safeParse({
      name: 'Bot',
      email: 'bot@spam.com',
      website: 'http://spam.com',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty honeypot field', () => {
    const result = leadSchema.safeParse({
      name: 'Real Person',
      email: 'real@example.com',
      website: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects name exceeding 200 chars', () => {
    const result = leadSchema.safeParse({
      name: 'A'.repeat(201),
      email: 'test@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects message exceeding 2000 chars', () => {
    const result = leadSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      message: 'X'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('citySlug is optional — missing is valid', () => {
    const result = leadSchema.safeParse({
      name: 'No City',
      email: 'nocity@example.com',
    });
    expect(result.success).toBe(true);
    expect(result.data?.citySlug).toBeUndefined();
  });
});
