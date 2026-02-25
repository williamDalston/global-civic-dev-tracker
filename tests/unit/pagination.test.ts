import { describe, it, expect } from 'vitest';
import { getPagination, getOffset } from '@/lib/utils/pagination';

describe('getPagination', () => {
  it('calculates correct total pages', () => {
    const result = getPagination(1, 24, 100);
    expect(result.totalPages).toBe(5);
  });

  it('returns hasNext=true when not on last page', () => {
    const result = getPagination(1, 24, 100);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(false);
  });

  it('returns hasNext=false on last page', () => {
    const result = getPagination(5, 24, 100);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });

  it('handles single page', () => {
    const result = getPagination(1, 24, 10);
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
  });

  it('handles zero items', () => {
    const result = getPagination(1, 24, 0);
    expect(result.totalPages).toBe(0);
  });
});

describe('getOffset', () => {
  it('returns 0 for page 1', () => {
    expect(getOffset(1, 24)).toBe(0);
  });

  it('returns correct offset for page 3', () => {
    expect(getOffset(3, 24)).toBe(48);
  });
});
