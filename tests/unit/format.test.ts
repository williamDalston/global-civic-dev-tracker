import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeDate, formatCurrency, formatNumber, truncate } from '@/lib/utils/format';

describe('formatDate', () => {
  it('formats valid ISO date', () => {
    const result = formatDate('2024-06-15');
    expect(result).toBeTruthy();
    expect(result).not.toBe('N/A');
  });

  it('returns N/A for null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatDate(undefined)).toBe('N/A');
  });
});

describe('formatCurrency', () => {
  it('formats positive number', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('1,500');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('returns N/A for null', () => {
    expect(formatCurrency(null)).toBe('N/A');
  });

  it('formats millions', () => {
    const result = formatCurrency(2500000);
    expect(result).toContain('2,500,000');
  });
});

describe('formatNumber', () => {
  it('formats with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('handles small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('truncate', () => {
  it('returns short string unchanged', () => {
    expect(truncate('hello', 100)).toBe('hello');
  });

  it('truncates long string with ellipsis', () => {
    const result = truncate('a'.repeat(50), 20);
    expect(result).toHaveLength(20);
    expect(result.endsWith('...')).toBe(true);
  });

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});
