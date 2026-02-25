import type { MetadataRoute } from 'next';
import { SITE_URL, SITEMAP_URLS_PER_FILE } from '@/lib/config/constants';
import { COUNTRIES } from '@/lib/config/countries';
import { CITIES } from '@/lib/config/cities';
import { safeQuery } from '@/lib/db/safe-query';
import { db } from '@/lib/db';
import { permits, neighborhoods, cities } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

/**
 * Build a Map of DB city ID → CITIES config entry by matching on slug.
 */
async function buildCityIdMap() {
  const dbCities = await safeQuery(async () => {
    return db.select({ id: cities.id, slug: cities.slug }).from(cities);
  });
  const map = new Map<number, (typeof CITIES)[number]>();
  if (dbCities) {
    for (const dbCity of dbCities) {
      const config = CITIES.find((c) => c.slug === dbCity.slug);
      if (config) map.set(dbCity.id, config);
    }
  }
  return map;
}

/**
 * generateSitemaps() creates a sitemap index with one sitemap per chunk.
 * Sitemap 0 = static/country/city pages
 * Sitemap 1+ = permit pages in batches of SITEMAP_URLS_PER_FILE
 */
export async function generateSitemaps() {
  // Always have at least the static sitemap
  const sitemaps = [{ id: 0 }];

  const totalPermits = await safeQuery(async () => {
    const result = await db
      .select({ count: count() })
      .from(permits)
      .where(eq(permits.noindex, false));
    return result[0]?.count ?? 0;
  });

  if (totalPermits && totalPermits > 0) {
    const numPermitSitemaps = Math.ceil(totalPermits / SITEMAP_URLS_PER_FILE);
    for (let i = 1; i <= numPermitSitemaps; i++) {
      sitemaps.push({ id: i });
    }
  }

  return sitemaps;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Sitemap 0: static pages, countries, cities, neighborhoods
  if (id === 0) {
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: SITE_URL,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ];

    const countryPages: MetadataRoute.Sitemap = COUNTRIES.map((country) => ({
      url: `${SITE_URL}/${country.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

    const cityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
      url: `${SITE_URL}/${city.countrySlug}/${city.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    // Fetch neighborhoods from DB
    const neighborhoodPages: MetadataRoute.Sitemap = [];
    const dbNeighborhoods = await safeQuery(async () => {
      return db
        .select({
          slug: neighborhoods.slug,
          cityId: neighborhoods.cityId,
          updatedAt: neighborhoods.updatedAt,
        })
        .from(neighborhoods);
    });

    if (dbNeighborhoods) {
      const cityById = await buildCityIdMap();

      for (const hood of dbNeighborhoods) {
        const city = cityById.get(hood.cityId);
        if (!city) continue;
        neighborhoodPages.push({
          url: `${SITE_URL}/${city.countrySlug}/${city.slug}/${hood.slug}`,
          lastModified: hood.updatedAt ?? now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });
      }
    }

    return [...staticPages, ...countryPages, ...cityPages, ...neighborhoodPages];
  }

  // Sitemap 1+: permit pages
  const offset = (id - 1) * SITEMAP_URLS_PER_FILE;

  const permitPages = await safeQuery(async () => {
    return db
      .select({
        slug: permits.slug,
        cityId: permits.cityId,
        neighborhoodId: permits.neighborhoodId,
        updatedAt: permits.updatedAt,
      })
      .from(permits)
      .where(eq(permits.noindex, false))
      .orderBy(permits.id)
      .limit(SITEMAP_URLS_PER_FILE)
      .offset(offset);
  });

  if (!permitPages || permitPages.length === 0) return [];

  // We need neighborhood slugs — fetch them
  const neighborhoodSlugs = await safeQuery(async () => {
    const result = await db
      .select({ id: neighborhoods.id, slug: neighborhoods.slug, cityId: neighborhoods.cityId })
      .from(neighborhoods);
    return new Map(result.map((n) => [n.id, { slug: n.slug, cityId: n.cityId }]));
  });

  const cityById = await buildCityIdMap();

  return permitPages
    .map((permit) => {
      const city = cityById.get(permit.cityId);
      const hood = permit.neighborhoodId
        ? neighborhoodSlugs?.get(permit.neighborhoodId)
        : null;
      if (!city || !hood) return null;

      return {
        url: `${SITE_URL}/${city.countrySlug}/${city.slug}/${hood.slug}/${permit.slug}`,
        lastModified: permit.updatedAt ?? new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}
