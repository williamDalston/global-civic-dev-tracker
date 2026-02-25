import { eq } from 'drizzle-orm';
import { db } from '..';
import { cities, countries } from '../schema';

export async function getCityBySlug(slug: string) {
  const result = await db
    .select()
    .from(cities)
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .where(eq(cities.slug, slug))
    .limit(1);
  if (!result[0]) return null;
  return {
    ...result[0].cities,
    country: result[0].countries,
  };
}

export async function getCitiesByCountry(countrySlug: string) {
  const result = await db
    .select()
    .from(cities)
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .where(eq(countries.slug, countrySlug));
  return result.map((r) => ({
    ...r.cities,
    country: r.countries,
  }));
}

export async function getAllCities() {
  const result = await db
    .select()
    .from(cities)
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .orderBy(cities.name);
  return result.map((r) => ({
    ...r.cities,
    country: r.countries,
  }));
}

export async function getCountryBySlug(slug: string) {
  const result = await db
    .select()
    .from(countries)
    .where(eq(countries.slug, slug))
    .limit(1);
  return result[0] ?? null;
}

export async function getAllCountries() {
  return db.select().from(countries).orderBy(countries.name);
}
