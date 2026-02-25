import { eq, desc } from 'drizzle-orm';
import { db } from '..';
import { leads } from '../schema';

export async function createLead(data: {
  permitId?: number;
  cityId: number;
  neighborhoodId?: number;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  workType?: string;
  sourceUrl?: string;
  utmSource?: string;
  utmMedium?: string;
}) {
  const result = await db.insert(leads).values(data).returning();
  return result[0];
}

export async function getLeadsByCity(cityId: number, limit: number = 50) {
  return db
    .select()
    .from(leads)
    .where(eq(leads.cityId, cityId))
    .orderBy(desc(leads.createdAt))
    .limit(limit);
}

export async function updateLeadStatus(leadId: number, status: string, routedTo?: string[]) {
  return db
    .update(leads)
    .set({
      status,
      routedTo: routedTo ? routedTo : undefined,
      routedAt: routedTo ? new Date() : undefined,
    })
    .where(eq(leads.id, leadId));
}
