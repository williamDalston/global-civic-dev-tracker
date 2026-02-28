import { eq, and, desc, count, sql, ilike } from 'drizzle-orm';
import { db } from '..';
import { permits, neighborhoods } from '../schema';

export async function getPermitBySlug(cityId: number, slug: string) {
  const result = await db
    .select()
    .from(permits)
    .where(and(eq(permits.cityId, cityId), eq(permits.slug, slug)))
    .limit(1);
  return result[0] ?? null;
}

export async function getPermitsByNeighborhood(
  neighborhoodId: number,
  page: number = 1,
  pageSize: number = 24,
  filters?: { category?: string; search?: string }
) {
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(permits.neighborhoodId, neighborhoodId),
    eq(permits.noindex, false),
  ];

  if (filters?.category) {
    conditions.push(eq(permits.permitCategory, filters.category));
  }
  if (filters?.search) {
    conditions.push(ilike(permits.propertyAddress, `%${filters.search}%`));
  }

  const whereClause = and(...conditions);

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(permits)
      .where(whereClause)
      .orderBy(desc(permits.issueDate))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(permits)
      .where(whereClause),
  ]);
  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function getPermitsByCity(
  cityId: number,
  page: number = 1,
  pageSize: number = 24
) {
  const offset = (page - 1) * pageSize;
  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(permits)
      .where(and(eq(permits.cityId, cityId), eq(permits.noindex, false)))
      .orderBy(desc(permits.issueDate))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(permits)
      .where(and(eq(permits.cityId, cityId), eq(permits.noindex, false))),
  ]);
  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function getRecentPermits(cityId: number, limit: number = 10) {
  const result = await db
    .select({
      id: permits.id,
      globalPermitId: permits.globalPermitId,
      propertyAddress: permits.propertyAddress,
      permitCategory: permits.permitCategory,
      permitType: permits.permitType,
      status: permits.status,
      issueDate: permits.issueDate,
      estimatedCost: permits.estimatedCost,
      slug: permits.slug,
      workDescription: permits.workDescription,
      neighborhoodSlug: neighborhoods.slug,
    })
    .from(permits)
    .leftJoin(neighborhoods, eq(permits.neighborhoodId, neighborhoods.id))
    .where(and(eq(permits.cityId, cityId), eq(permits.noindex, false)))
    .orderBy(desc(permits.issueDate))
    .limit(limit);
  return result;
}

export async function getRelatedPermits(
  permitId: number,
  neighborhoodId: number,
  category: string,
  limit: number = 6
) {
  return db
    .select()
    .from(permits)
    .where(
      and(
        eq(permits.neighborhoodId, neighborhoodId),
        eq(permits.permitCategory, category),
        eq(permits.noindex, false),
        sql`${permits.id} != ${permitId}`
      )
    )
    .orderBy(desc(permits.issueDate))
    .limit(limit);
}

export async function getPermitCountByCity(cityId: number) {
  const result = await db
    .select({ count: count() })
    .from(permits)
    .where(and(eq(permits.cityId, cityId), eq(permits.noindex, false)));
  return result[0]?.count ?? 0;
}

export async function getCategoryStats(cityId: number) {
  return db
    .select({
      category: permits.permitCategory,
      count: count(),
    })
    .from(permits)
    .where(and(eq(permits.cityId, cityId), eq(permits.noindex, false)))
    .groupBy(permits.permitCategory)
    .orderBy(desc(count()));
}

export async function getPermitsWithoutNarrative(limit: number = 100) {
  return db
    .select()
    .from(permits)
    .where(sql`${permits.aiNarrative} IS NULL AND ${permits.noindex} = false`)
    .orderBy(desc(permits.issueDate))
    .limit(limit);
}

export async function getMonthlyTrend(cityId: number, months: number = 12) {
  return db
    .select({
      month: sql<string>`to_char(${permits.issueDate}, 'YYYY-MM')`,
      count: count(),
    })
    .from(permits)
    .where(
      and(
        eq(permits.cityId, cityId),
        eq(permits.noindex, false),
        sql`${permits.issueDate} >= current_date - interval '${sql.raw(String(months))} months'`
      )
    )
    .groupBy(sql`to_char(${permits.issueDate}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${permits.issueDate}, 'YYYY-MM')`);
}

export async function getPermitsWithCoordinates(cityId: number, limit: number = 500) {
  return db
    .select({
      id: permits.id,
      latitude: permits.latitude,
      longitude: permits.longitude,
      propertyAddress: permits.propertyAddress,
      permitCategory: permits.permitCategory,
      status: permits.status,
      slug: permits.slug,
      estimatedCost: permits.estimatedCost,
    })
    .from(permits)
    .where(
      and(
        eq(permits.cityId, cityId),
        eq(permits.noindex, false),
        sql`${permits.latitude} IS NOT NULL`,
        sql`${permits.longitude} IS NOT NULL`
      )
    )
    .orderBy(desc(permits.issueDate))
    .limit(limit);
}

export async function getPermitsWithCoordinatesByNeighborhood(
  neighborhoodId: number,
  limit: number = 200
) {
  return db
    .select({
      id: permits.id,
      latitude: permits.latitude,
      longitude: permits.longitude,
      propertyAddress: permits.propertyAddress,
      permitCategory: permits.permitCategory,
      status: permits.status,
      slug: permits.slug,
      estimatedCost: permits.estimatedCost,
    })
    .from(permits)
    .where(
      and(
        eq(permits.neighborhoodId, neighborhoodId),
        eq(permits.noindex, false),
        sql`${permits.latitude} IS NOT NULL`,
        sql`${permits.longitude} IS NOT NULL`
      )
    )
    .orderBy(desc(permits.issueDate))
    .limit(limit);
}

export async function getTotalPermitCount() {
  const result = await db
    .select({ count: count() })
    .from(permits)
    .where(eq(permits.noindex, false));
  return result[0]?.count ?? 0;
}

export async function getNeighborhoodCategoryStats(neighborhoodId: number) {
  return db
    .select({
      category: permits.permitCategory,
      count: count(),
    })
    .from(permits)
    .where(and(eq(permits.neighborhoodId, neighborhoodId), eq(permits.noindex, false)))
    .groupBy(permits.permitCategory)
    .orderBy(desc(count()));
}

export async function getNeighborhoodAvgCost(neighborhoodId: number) {
  const result = await db
    .select({
      avgCost: sql<string>`ROUND(AVG(${permits.estimatedCost}::numeric), 0)`,
    })
    .from(permits)
    .where(
      and(
        eq(permits.neighborhoodId, neighborhoodId),
        eq(permits.noindex, false),
        sql`${permits.estimatedCost} IS NOT NULL AND ${permits.estimatedCost}::numeric > 0`
      )
    );
  return result[0]?.avgCost ? parseInt(result[0].avgCost) : null;
}
