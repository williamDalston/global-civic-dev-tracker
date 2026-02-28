import { eq, desc, count, sql, and } from 'drizzle-orm';
import { db } from '..';
import { leads, cities, etlSyncState, permits } from '../schema';

// ─── Lead Stats ──────────────────────────────────────────────

export async function getLeadStats() {
  const result = await db
    .select({
      status: leads.status,
      count: count(),
    })
    .from(leads)
    .groupBy(leads.status);

  const stats = { new: 0, contacted: 0, converted: 0, total: 0 };
  for (const row of result) {
    const key = row.status ?? 'new';
    if (key in stats) {
      stats[key as keyof typeof stats] = row.count;
    }
    stats.total += row.count;
  }

  return stats;
}

// ─── Paginated Leads ─────────────────────────────────────────

export async function getLeadsPaginated(
  page: number = 1,
  pageSize: number = 25,
  filters?: { status?: string; cityId?: number }
) {
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(leads.status, filters.status));
  }
  if (filters?.cityId) {
    conditions.push(eq(leads.cityId, filters.cityId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        message: leads.message,
        workType: leads.workType,
        status: leads.status,
        sourceUrl: leads.sourceUrl,
        utmSource: leads.utmSource,
        utmMedium: leads.utmMedium,
        createdAt: leads.createdAt,
        cityName: cities.name,
      })
      .from(leads)
      .leftJoin(cities, eq(leads.cityId, cities.id))
      .where(whereClause)
      .orderBy(desc(leads.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(leads)
      .where(whereClause),
  ]);

  return {
    items,
    total: totalResult[0]?.count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((totalResult[0]?.count ?? 0) / pageSize),
  };
}

// ─── ETL Sync States ─────────────────────────────────────────

export async function getAllSyncStates() {
  return db
    .select({
      id: etlSyncState.id,
      cityId: etlSyncState.cityId,
      cityName: cities.name,
      citySlug: cities.slug,
      lastSyncAt: etlSyncState.lastSyncAt,
      lastOffset: etlSyncState.lastOffset,
      lastRecordId: etlSyncState.lastRecordId,
      recordsSynced: etlSyncState.recordsSynced,
      status: etlSyncState.status,
      errorMessage: etlSyncState.errorMessage,
      updatedAt: etlSyncState.updatedAt,
    })
    .from(etlSyncState)
    .leftJoin(cities, eq(etlSyncState.cityId, cities.id))
    .orderBy(cities.name);
}

// ─── Total Permits Count ─────────────────────────────────────

export async function getTotalPermitsCount() {
  const result = await db.select({ count: count() }).from(permits);
  return result[0]?.count ?? 0;
}

// ─── City Sync State (for freshness indicator) ──────────────

export async function getCitySyncState(cityId: number) {
  const result = await db
    .select()
    .from(etlSyncState)
    .where(eq(etlSyncState.cityId, cityId))
    .limit(1);
  return result[0] ?? null;
}

// ─── All Cities (for filter dropdowns) ───────────────────────

export async function getAllCities() {
  return db
    .select({ id: cities.id, name: cities.name, slug: cities.slug })
    .from(cities)
    .orderBy(cities.name);
}
