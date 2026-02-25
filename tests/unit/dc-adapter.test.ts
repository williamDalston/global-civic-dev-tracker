import { describe, it, expect } from 'vitest';
import { DCAdapter } from '@/lib/etl/adapters/dc';
import dcFixtures from '../fixtures/dc-permits.json';

const adapter = new DCAdapter({
  citySlug: 'washington-dc',
  cityId: 1,
  apiBaseUrl: 'https://opendata.dc.gov/api/v3/datasets',
  datasetId: 'building-permits-in-2024',
});

describe('DCAdapter.transformToUniversal', () => {
  it('transforms a standard DC permit', () => {
    const result = adapter.transformToUniversal(dcFixtures[0]);
    expect(result).not.toBeNull();
    expect(result!.globalPermitId).toBe('B2401234');
    expect(result!.propertyAddress).toBe('1234 14TH ST NW');
    expect(result!.issueDate).toBe('2024-06-15');
    expect(result!.applicationDate).toBe('2024-05-01');
    expect(result!.workDescription).toContain('Interior renovation');
    expect(result!.permitCategory).toBe('renovation');
    expect(result!.status).toBe('approved');
    expect(result!.estimatedCost).toBe(75000);
    expect(result!.latitude).toBe(38.912);
    expect(result!.longitude).toBe(-77.032);
  });

  it('categorizes new construction correctly', () => {
    const result = adapter.transformToUniversal(dcFixtures[1]);
    expect(result).not.toBeNull();
    expect(result!.permitCategory).toBe('new-construction');
    expect(result!.status).toBe('pending'); // UNDER REVIEW
  });

  it('categorizes demolition correctly', () => {
    const result = adapter.transformToUniversal(dcFixtures[2]);
    expect(result).not.toBeNull();
    expect(result!.permitCategory).toBe('demolition');
  });

  it('falls back to dcra_internal_number when permit_id is missing', () => {
    const result = adapter.transformToUniversal(dcFixtures[3]);
    expect(result).not.toBeNull();
    expect(result!.globalPermitId).toBe('ELEC-2024-001');
    expect(result!.permitCategory).toBe('electrical');
    expect(result!.status).toBe('completed');
  });

  it('returns null for records without permit_id and address', () => {
    const result = adapter.transformToUniversal(dcFixtures[4]);
    expect(result).toBeNull();
  });

  it('handles missing optional fields gracefully', () => {
    const result = adapter.transformToUniversal(dcFixtures[2]);
    expect(result).not.toBeNull();
    expect(result!.issueDate).toBeNull();
    expect(result!.applicationDate).toBeNull();
    expect(result!.latitude).toBeNull();
    expect(result!.longitude).toBeNull();
  });
});
