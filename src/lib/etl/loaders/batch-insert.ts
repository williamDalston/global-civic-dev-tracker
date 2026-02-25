import { db } from '@/lib/db';
import { permits } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import type { UniversalPermit } from '@/types';

interface PermitInsertData {
  globalPermitId: string;
  cityId: number;
  neighborhoodId?: number;
  issueDate: string | null;
  applicationDate: string | null;
  propertyAddress: string;
  workDescription: string | null;
  permitCategory: string;
  permitType: string | null;
  status: string;
  estimatedCost: string | null;
  latitude: number | null;
  longitude: number | null;
  slug: string;
  rawData: Record<string, unknown>;
  sourceUrl: string | null;
}

export async function batchUpsertPermits(
  cityId: number,
  normalizedPermits: Array<UniversalPermit & { slug: string; neighborhoodId?: number }>
): Promise<{ inserted: number; updated: number }> {
  if (normalizedPermits.length === 0) return { inserted: 0, updated: 0 };

  const values: PermitInsertData[] = normalizedPermits.map((p) => ({
    globalPermitId: p.globalPermitId,
    cityId,
    neighborhoodId: p.neighborhoodId,
    issueDate: p.issueDate,
    applicationDate: p.applicationDate,
    propertyAddress: p.propertyAddress,
    workDescription: p.workDescription,
    permitCategory: p.permitCategory,
    permitType: p.permitType,
    status: p.status,
    estimatedCost: p.estimatedCost?.toString() || null,
    latitude: p.latitude,
    longitude: p.longitude,
    slug: p.slug,
    rawData: p.rawData,
    sourceUrl: p.sourceUrl,
  }));

  // Process in chunks of 500 to avoid query size limits
  const CHUNK_SIZE = 500;
  let totalInserted = 0;
  let totalUpdated = 0;

  for (let i = 0; i < values.length; i += CHUNK_SIZE) {
    const chunk = values.slice(i, i + CHUNK_SIZE);

    const result = await db
      .insert(permits)
      .values(chunk)
      .onConflictDoUpdate({
        target: [permits.cityId, permits.globalPermitId],
        set: {
          issueDate: sql`excluded.issue_date`,
          propertyAddress: sql`excluded.property_address`,
          workDescription: sql`excluded.work_description`,
          permitCategory: sql`excluded.permit_category`,
          permitType: sql`excluded.permit_type`,
          status: sql`excluded.status`,
          estimatedCost: sql`excluded.estimated_cost`,
          latitude: sql`excluded.latitude`,
          longitude: sql`excluded.longitude`,
          rawData: sql`excluded.raw_data`,
          updatedAt: sql`NOW()`,
        },
      })
      .returning({ id: permits.id });

    totalInserted += result.length;
  }

  return { inserted: totalInserted, updated: totalUpdated };
}
