import { describe, it, expect } from 'vitest';
import { normalizePermit } from '@/lib/etl/transformers/normalize';
import type { UniversalPermit } from '@/types';

const basePermit: UniversalPermit = {
  globalPermitId: 'DC-2024-001',
  propertyAddress: '123  Main  St ,, NW',
  workDescription: '  Kitchen renovation  ',
  permitCategory: 'Renovation',
  permitType: 'Building',
  status: 'approved',
  issueDate: '2024-01-15',
  applicationDate: '2024-01-01',
  estimatedCost: 50000,
  latitude: 38.9072,
  longitude: -77.0369,
  rawData: {},
  sourceUrl: null,
};

describe('normalizePermit', () => {
  it('normalizes address whitespace', () => {
    const result = normalizePermit(basePermit);
    expect(result.propertyAddress).toBe('123 Main St , NW');
  });

  it('trims work description', () => {
    const result = normalizePermit(basePermit);
    expect(result.workDescription).toBe('Kitchen renovation');
  });

  it('lowercases permit category', () => {
    const result = normalizePermit(basePermit);
    expect(result.permitCategory).toBe('renovation');
  });

  it('generates a slug', () => {
    const result = normalizePermit(basePermit);
    expect(result.slug).toBeDefined();
    expect(result.slug).toContain('renovation');
    expect(result.slug).toContain('dc-2024-001');
  });

  it('handles null work description', () => {
    const result = normalizePermit({ ...basePermit, workDescription: null });
    expect(result.workDescription).toBeNull();
  });
});
