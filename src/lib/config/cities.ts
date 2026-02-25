export interface CityConfig {
  name: string;
  slug: string;
  countrySlug: string;
  timezone: string;
  centerLat: number;
  centerLng: number;
  apiSource: 'socrata' | 'arcgis' | 'ckan' | 'custom';
  apiBaseUrl: string;
  datasetId?: string;
}

export const CITIES: CityConfig[] = [
  {
    name: 'Washington, D.C.',
    slug: 'washington-dc',
    countrySlug: 'us',
    timezone: 'America/New_York',
    centerLat: 38.9072,
    centerLng: -77.0369,
    apiSource: 'socrata',
    apiBaseUrl: 'https://opendata.dc.gov/api/v3/datasets',
    datasetId: 'building-permits-in-2024',
  },
  {
    name: 'New York City',
    slug: 'new-york-city',
    countrySlug: 'us',
    timezone: 'America/New_York',
    centerLat: 40.7128,
    centerLng: -74.006,
    apiSource: 'socrata',
    apiBaseUrl: 'https://data.cityofnewyork.us/resource',
    datasetId: 'rbx6-tga4',
  },
  {
    name: 'Chicago',
    slug: 'chicago',
    countrySlug: 'us',
    timezone: 'America/Chicago',
    centerLat: 41.8781,
    centerLng: -87.6298,
    apiSource: 'socrata',
    apiBaseUrl: 'https://data.cityofchicago.org/resource',
    datasetId: 'ydr8-5enu',
  },
  {
    name: 'London',
    slug: 'london',
    countrySlug: 'uk',
    timezone: 'Europe/London',
    centerLat: 51.5074,
    centerLng: -0.1278,
    apiSource: 'custom',
    apiBaseUrl: 'https://planningdata.london.gov.uk/api-guest/applications',
  },
  {
    name: 'Sydney',
    slug: 'sydney',
    countrySlug: 'au',
    timezone: 'Australia/Sydney',
    centerLat: -33.8688,
    centerLng: 151.2093,
    apiSource: 'custom',
    apiBaseUrl: 'https://api.planningportal.nsw.gov.au/online-da',
  },
  {
    name: 'Toronto',
    slug: 'toronto',
    countrySlug: 'ca',
    timezone: 'America/Toronto',
    centerLat: 43.6532,
    centerLng: -79.3832,
    apiSource: 'ckan',
    apiBaseUrl: 'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action',
    datasetId: 'building-permits-active-permits',
  },
];

export function getCityBySlug(slug: string) {
  return CITIES.find((c) => c.slug === slug);
}

export function getCitiesByCountry(countrySlug: string) {
  return CITIES.filter((c) => c.countrySlug === countrySlug);
}
