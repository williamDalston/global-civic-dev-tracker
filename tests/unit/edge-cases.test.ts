import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeDate, formatCurrency, formatNumber, truncate } from '@/lib/utils/format';
import { getPagination, getOffset } from '@/lib/utils/pagination';
import { RateLimiter } from '@/lib/utils/rate-limiter';
import { slugify, permitSlug } from '@/lib/utils/slugify';
import { checkNarrativeQuality, checkUniqueness, isUnique } from '@/lib/etl/ai/quality-gate';

describe('format edge cases', () => {
  it('formatDate handles null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('formatDate handles invalid date string', () => {
    const result = formatDate('not-a-date');
    expect(result).toBeTruthy(); // Falls back to original string
  });

  it('formatRelativeDate handles null', () => {
    expect(formatRelativeDate(null)).toBe('N/A');
  });

  it('formatCurrency handles null', () => {
    expect(formatCurrency(null)).toBe('N/A');
  });

  it('formatCurrency formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formatCurrency formats large numbers', () => {
    const result = formatCurrency(1500000);
    expect(result).toContain('1,500,000');
  });

  it('formatNumber formats with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('truncate does not modify short strings', () => {
    expect(truncate('short', 100)).toBe('short');
  });

  it('truncate adds ellipsis for long strings', () => {
    const result = truncate('a'.repeat(50), 20);
    expect(result).toHaveLength(20);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('pagination edge cases', () => {
  it('page 1 of 1 has neither prev nor next', () => {
    const p = getPagination(1, 10, 5);
    expect(p.hasPrev).toBe(false);
    expect(p.hasNext).toBe(false);
    expect(p.totalPages).toBe(1);
  });

  it('handles page beyond total', () => {
    const p = getPagination(10, 24, 100);
    expect(p.page).toBe(10);
    expect(p.hasNext).toBe(false);
  });

  it('handles pageSize of 1', () => {
    const p = getPagination(1, 1, 100);
    expect(p.totalPages).toBe(100);
    expect(p.hasNext).toBe(true);
  });

  it('getOffset for large page number', () => {
    expect(getOffset(1000, 24)).toBe(23976);
  });
});

describe('RateLimiter', () => {
  it('allows immediate execution under concurrency limit', async () => {
    const limiter = new RateLimiter(2, 0);
    const start = Date.now();
    await limiter.wrap(async () => 'done');
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('returns the function result', async () => {
    const limiter = new RateLimiter(1, 0);
    const result = await limiter.wrap(async () => 42);
    expect(result).toBe(42);
  });

  it('propagates errors', async () => {
    const limiter = new RateLimiter(1, 0);
    await expect(
      limiter.wrap(async () => {
        throw new Error('test error');
      })
    ).rejects.toThrow('test error');
  });
});

describe('slugify edge cases', () => {
  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles unicode characters', () => {
    const result = slugify('Café & Résumé');
    expect(result).not.toContain('é');
  });

  it('permitSlug handles complex IDs', () => {
    const result = permitSlug('NYC/DOB/2024-001#A', 'new-construction');
    expect(result).toContain('new-construction');
    expect(result).not.toContain('#');
    expect(result).not.toContain('/');
  });
});

describe('quality-gate edge cases', () => {
  it('checkNarrativeQuality detects bold markdown', () => {
    const longUnique = Array.from({ length: 100 }, (_, i) =>
      `Point ${i} discusses a unique aspect of neighborhood planning.`
    ).join(' ');
    const text = longUnique + ' **bold text here**';
    const result = checkNarrativeQuality(text);
    expect(result.reasons.some((r) => r.includes('markdown'))).toBe(true);
  });

  it('checkNarrativeQuality detects ChatGPT reference', () => {
    const text = Array.from({ length: 100 }, (_, i) =>
      `Topic ${i} about urban growth patterns.`
    ).join(' ') + ' Powered by ChatGPT.';
    const result = checkNarrativeQuality(text);
    expect(result.reasons.some((r) => r.includes('AI self-reference'))).toBe(true);
  });

  it('checkUniqueness handles single-word texts', () => {
    // Single words produce no bigrams
    const score = checkUniqueness('hello', ['hello']);
    expect(score).toBe(1.0); // No bigrams → intersection = 0, treated as unique
  });

  it('isUnique returns boolean', () => {
    expect(typeof isUnique('some text here', [])).toBe('boolean');
    expect(isUnique('some text here', [])).toBe(true);
  });
});
