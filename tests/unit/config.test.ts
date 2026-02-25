import { describe, it, expect } from 'vitest';
import { COUNTRIES, getCountryBySlug } from '@/lib/config/countries';
import { CITIES, getCityBySlug, getCitiesByCountry } from '@/lib/config/cities';

describe('countries config', () => {
  it('has 4 countries', () => {
    expect(COUNTRIES).toHaveLength(4);
  });

  it('each country has required fields', () => {
    for (const country of COUNTRIES) {
      expect(country.name).toBeTruthy();
      expect(country.slug).toBeTruthy();
      expect(country.code).toHaveLength(2);
    }
  });

  it('getCountryBySlug finds US', () => {
    expect(getCountryBySlug('us')?.name).toBe('United States');
  });

  it('getCountryBySlug returns undefined for unknown', () => {
    expect(getCountryBySlug('xyz')).toBeUndefined();
  });
});

describe('cities config', () => {
  it('has 6 cities', () => {
    expect(CITIES).toHaveLength(6);
  });

  it('getCitiesByCountry returns US cities', () => {
    const usCities = getCitiesByCountry('us');
    expect(usCities).toHaveLength(3);
  });

  it('getCityBySlug finds Washington DC', () => {
    expect(getCityBySlug('washington-dc')?.name).toBe('Washington, D.C.');
  });

  it('each city has valid coordinates', () => {
    for (const city of CITIES) {
      expect(city.centerLat).toBeGreaterThan(-90);
      expect(city.centerLat).toBeLessThan(90);
      expect(city.centerLng).toBeGreaterThan(-180);
      expect(city.centerLng).toBeLessThan(180);
    }
  });
});
