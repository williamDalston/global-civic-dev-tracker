import { describe, it, expect } from 'vitest';
import { ChicagoAdapter } from '@/lib/etl/adapters/chicago';
import chicagoFixtures from '../fixtures/chicago-permits.json';

const adapter = new ChicagoAdapter({
  citySlug: 'chicago',
  cityId: 3,
  apiBaseUrl: 'https://data.cityofchicago.org/resource',
  datasetId: 'ydr8-5enu',
});

describe('ChicagoAdapter.transformToUniversal', () => {
  it('transforms a new construction permit with full address parts', () => {
    const result = adapter.transformToUniversal(chicagoFixtures[0]);
    expect(result).not.toBeNull();
    expect(result!.globalPermitId).toBe('100734456');
    expect(result!.propertyAddress).toContain('2345');
    expect(result!.propertyAddress).toContain('MILWAUKEE');
    expect(result!.propertyAddress).toContain('Chicago, IL');
    expect(result!.permitCategory).toBe('new-construction');
    expect(result!.status).toBe('approved'); // ISSUE
    expect(result!.estimatedCost).toBe(1200000);
    expect(result!.issueDate).toBe('2024-09-01');
  });

  it('handles permits with missing direction and street number only', () => {
    const result = adapter.transformToUniversal(chicagoFixtures[1]);
    expect(result).not.toBeNull();
    expect(result!.permitCategory).toBe('renovation');
    expect(result!.status).toBe('pending'); // RECEIVED
  });

  it('categorizes demolition correctly', () => {
    const result = adapter.transformToUniversal(chicagoFixtures[2]);
    expect(result).not.toBeNull();
    expect(result!.permitCategory).toBe('demolition');
  });

  it('returns null for records without permit ID', () => {
    const result = adapter.transformToUniversal(chicagoFixtures[3]);
    expect(result).toBeNull();
  });

  it('assembles address with direction when present', () => {
    const result = adapter.transformToUniversal(chicagoFixtures[0]);
    expect(result).not.toBeNull();
    expect(result!.propertyAddress).toContain('N');
  });
});
