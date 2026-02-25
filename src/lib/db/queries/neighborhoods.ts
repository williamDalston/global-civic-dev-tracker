import { eq, and, count } from 'drizzle-orm';
import { db } from '..';
import { neighborhoods, permits } from '../schema';

export async function getNeighborhoodBySlug(cityId: number, slug: string) {
  const result = await db
    .select()
    .from(neighborhoods)
    .where(and(eq(neighborhoods.cityId, cityId), eq(neighborhoods.slug, slug)))
    .limit(1);
  return result[0] ?? null;
}

export async function getNeighborhoodsByCity(cityId: number) {
  return db
    .select()
    .from(neighborhoods)
    .where(eq(neighborhoods.cityId, cityId))
    .orderBy(neighborhoods.name);
}

export async function getNeighborhoodsWithCounts(cityId: number) {
  return db
    .select({
      id: neighborhoods.id,
      name: neighborhoods.name,
      slug: neighborhoods.slug,
      centerLat: neighborhoods.centerLat,
      centerLng: neighborhoods.centerLng,
      permitCount: count(permits.id),
    })
    .from(neighborhoods)
    .leftJoin(
      permits,
      and(eq(permits.neighborhoodId, neighborhoods.id), eq(permits.noindex, false))
    )
    .where(eq(neighborhoods.cityId, cityId))
    .groupBy(
      neighborhoods.id,
      neighborhoods.name,
      neighborhoods.slug,
      neighborhoods.centerLat,
      neighborhoods.centerLng
    )
    .orderBy(neighborhoods.name);
}
