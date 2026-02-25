export const COUNTRIES = [
  { name: 'United States', slug: 'us', code: 'US' },
  { name: 'United Kingdom', slug: 'uk', code: 'GB' },
  { name: 'Australia', slug: 'au', code: 'AU' },
  { name: 'Canada', slug: 'ca', code: 'CA' },
] as const;

export type CountrySlug = (typeof COUNTRIES)[number]['slug'];

export function getCountryBySlug(slug: string) {
  return COUNTRIES.find((c) => c.slug === slug);
}
