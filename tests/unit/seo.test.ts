import { describe, it, expect } from 'vitest';
import {
  buildWebsiteSchema,
  buildBreadcrumbSchema,
  buildPlaceSchema,
  buildPermitSchema,
  buildCityHubSchema,
} from '@/lib/seo/structured-data';
import {
  buildHomeMeta,
  buildCountryMeta,
  buildCityMeta,
  buildNeighborhoodMeta,
  buildPermitMeta,
} from '@/lib/seo/meta';

describe('structured-data', () => {
  describe('buildWebsiteSchema', () => {
    it('returns valid WebSite schema', () => {
      const schema = buildWebsiteSchema();
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBeTruthy();
      expect(schema.url).toBeTruthy();
      expect(schema.potentialAction).toBeDefined();
    });
  });

  describe('buildBreadcrumbSchema', () => {
    it('returns correct positions', () => {
      const schema = buildBreadcrumbSchema([
        { name: 'Home', url: 'https://example.com' },
        { name: 'US', url: 'https://example.com/us' },
      ]);
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(2);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[1].position).toBe(2);
    });
  });

  describe('buildPlaceSchema', () => {
    it('includes geo coordinates when provided', () => {
      const schema = buildPlaceSchema({
        name: 'Adams Morgan',
        description: 'A neighborhood',
        url: 'https://example.com/us/washington-dc/adams-morgan',
        latitude: 38.92,
        longitude: -77.04,
        containedIn: 'Washington, D.C.',
      });
      expect(schema['@type']).toBe('Place');
      expect(schema.geo).toBeDefined();
      expect((schema.geo as Record<string, unknown>).latitude).toBe(38.92);
      expect(schema.containedInPlace).toBeDefined();
    });

    it('omits geo when coordinates are null', () => {
      const schema = buildPlaceSchema({
        name: 'Test',
        description: 'Test',
        url: 'https://example.com',
        latitude: null,
        longitude: null,
      });
      expect(schema.geo).toBeUndefined();
    });
  });

  describe('buildPermitSchema', () => {
    it('returns GovernmentPermit schema', () => {
      const schema = buildPermitSchema({
        permitId: 'B2401234',
        address: '123 Main St',
        category: 'renovation',
        status: 'approved',
        issueDate: '2024-06-15',
        estimatedCost: 75000,
        description: 'Kitchen renovation',
        url: 'https://example.com/permit',
        cityName: 'Washington, D.C.',
      });
      expect(schema['@type']).toBe('GovernmentPermit');
      expect(schema.validFrom).toBe('2024-06-15');
      expect(schema.spatialCoverage).toBeDefined();
    });
  });

  describe('buildCityHubSchema', () => {
    it('includes permit count when provided', () => {
      const schema = buildCityHubSchema({
        cityName: 'Washington, D.C.',
        countryName: 'United States',
        url: 'https://example.com/us/washington-dc',
        description: 'Track permits',
        latitude: 38.9072,
        longitude: -77.0369,
        permitCount: 5000,
      });
      expect(schema['@type']).toBe('CollectionPage');
      expect(schema.mainEntity).toBeDefined();
    });
  });
});

describe('meta helpers', () => {
  describe('buildHomeMeta', () => {
    it('returns metadata with title and description', () => {
      const meta = buildHomeMeta();
      expect(meta.title).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.openGraph).toBeDefined();
    });
  });

  describe('buildCountryMeta', () => {
    it('includes country name in title', () => {
      const meta = buildCountryMeta('United States', 'us');
      expect(meta.title).toContain('United States');
      expect(meta.alternates?.canonical).toContain('/us');
    });
  });

  describe('buildCityMeta', () => {
    it('includes permit count when provided', () => {
      const meta = buildCityMeta('Washington, D.C.', 'United States', 'us', 'washington-dc', 5000);
      expect(meta.description).toContain('5,000');
    });

    it('works without permit count', () => {
      const meta = buildCityMeta('London', 'United Kingdom', 'uk', 'london');
      expect(meta.title).toContain('London');
    });
  });

  describe('buildNeighborhoodMeta', () => {
    it('includes both neighborhood and city name', () => {
      const meta = buildNeighborhoodMeta(
        'Adams Morgan',
        'Washington, D.C.',
        'us',
        'washington-dc',
        'adams-morgan'
      );
      expect(meta.title).toContain('Adams Morgan');
      expect(meta.title).toContain('Washington');
    });
  });

  describe('buildPermitMeta', () => {
    it('includes category and address in title', () => {
      const meta = buildPermitMeta({
        permitId: 'B2401234',
        address: '123 Main St',
        category: 'renovation',
        cityName: 'Washington, D.C.',
        neighborhoodName: 'Adams Morgan',
        countrySlug: 'us',
        citySlug: 'washington-dc',
        neighborhoodSlug: 'adams-morgan',
        permitSlug: 'renovation-b2401234',
      });
      expect(meta.title).toContain('Renovation');
      expect(meta.title).toContain('123 Main St');
    });

    it('uses work description when available', () => {
      const meta = buildPermitMeta({
        permitId: 'B2401234',
        address: '123 Main St',
        category: 'renovation',
        cityName: 'Washington, D.C.',
        neighborhoodName: 'Adams Morgan',
        countrySlug: 'us',
        citySlug: 'washington-dc',
        neighborhoodSlug: 'adams-morgan',
        permitSlug: 'renovation-b2401234',
        workDescription: 'Complete kitchen renovation with new cabinets',
      });
      expect(meta.description).toContain('Complete kitchen renovation');
    });
  });
});
