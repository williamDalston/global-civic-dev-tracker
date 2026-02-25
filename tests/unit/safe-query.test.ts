import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeQuery } from '@/lib/db/safe-query';

describe('safeQuery', () => {
  const originalEnv = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it('returns null when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL;
    const result = await safeQuery(async () => 'data');
    expect(result).toBeNull();
  });

  it('returns query result when DATABASE_URL is set', async () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    const result = await safeQuery(async () => 42);
    expect(result).toBe(42);
  });

  it('returns null when query throws', async () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    const result = await safeQuery(async () => {
      throw new Error('connection failed');
    });
    expect(result).toBeNull();
  });

  it('passes through complex return types', async () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    const data = { items: [1, 2, 3], total: 3 };
    const result = await safeQuery(async () => data);
    expect(result).toEqual(data);
  });

  it('returns null for non-Error throws', async () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    const result = await safeQuery(async () => {
      throw 'string error';
    });
    expect(result).toBeNull();
  });
});
