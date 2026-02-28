import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '..';
import {
  contractors,
  contractorServiceAreas,
  contractorCategories,
  leadAssignments,
  contractorBillingHistory,
  cities,
  neighborhoods,
} from '../schema';

export async function getContractorByEmail(email: string) {
  const result = await db
    .select()
    .from(contractors)
    .where(eq(contractors.email, email.toLowerCase()))
    .limit(1);
  return result[0] ?? null;
}

export async function getContractorById(id: number) {
  const result = await db.select().from(contractors).where(eq(contractors.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getContractorBySlug(slug: string) {
  const result = await db.select().from(contractors).where(eq(contractors.slug, slug)).limit(1);
  return result[0] ?? null;
}

export async function getContractorByEmailVerifyToken(token: string) {
  const result = await db
    .select()
    .from(contractors)
    .where(eq(contractors.emailVerifyToken, token))
    .limit(1);
  return result[0] ?? null;
}

export async function getContractorByPasswordResetToken(token: string) {
  const result = await db
    .select()
    .from(contractors)
    .where(eq(contractors.passwordResetToken, token))
    .limit(1);
  return result[0] ?? null;
}

export async function createContractor(data: {
  email: string;
  passwordHash: string;
  companyName: string;
  contactName: string;
  phone: string;
  slug: string;
  website?: string;
  description?: string;
  licenseNumber?: string;
  yearsInBusiness?: number;
  employeeCount?: string;
  emailVerifyToken?: string;
}) {
  const result = await db
    .insert(contractors)
    .values({
      ...data,
      email: data.email.toLowerCase(),
    })
    .returning();
  return result[0];
}

export async function updateContractor(
  id: number,
  data: Partial<{
    companyName: string;
    contactName: string;
    phone: string;
    website: string;
    description: string;
    logoUrl: string;
    licenseNumber: string;
    yearsInBusiness: number;
    employeeCount: string;
    status: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    billingPlan: string;
    leadCredits: number;
    monthlyLeadLimit: number;
    leadsThisMonth: number;
    lastLeadResetAt: Date;
    emailVerified: boolean;
    emailVerifyToken: string | null;
    passwordHash: string;
    passwordResetToken: string | null;
    passwordResetExpires: Date | null;
  }>
) {
  const result = await db
    .update(contractors)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contractors.id, id))
    .returning();
  return result[0];
}

export async function addContractorServiceArea(
  contractorId: number,
  cityId: number,
  neighborhoodId?: number
) {
  const result = await db
    .insert(contractorServiceAreas)
    .values({ contractorId, cityId, neighborhoodId })
    .onConflictDoNothing()
    .returning();
  return result[0];
}

export async function removeContractorServiceArea(contractorId: number, areaId: number) {
  await db
    .delete(contractorServiceAreas)
    .where(
      and(eq(contractorServiceAreas.id, areaId), eq(contractorServiceAreas.contractorId, contractorId))
    );
}

export async function getContractorServiceAreas(contractorId: number) {
  return db
    .select({
      id: contractorServiceAreas.id,
      cityId: contractorServiceAreas.cityId,
      cityName: cities.name,
      citySlug: cities.slug,
      neighborhoodId: contractorServiceAreas.neighborhoodId,
      neighborhoodName: neighborhoods.name,
      neighborhoodSlug: neighborhoods.slug,
      isActive: contractorServiceAreas.isActive,
    })
    .from(contractorServiceAreas)
    .leftJoin(cities, eq(contractorServiceAreas.cityId, cities.id))
    .leftJoin(neighborhoods, eq(contractorServiceAreas.neighborhoodId, neighborhoods.id))
    .where(eq(contractorServiceAreas.contractorId, contractorId));
}

export async function addContractorCategory(contractorId: number, category: string) {
  const result = await db
    .insert(contractorCategories)
    .values({ contractorId, category })
    .onConflictDoNothing()
    .returning();
  return result[0];
}

export async function removeContractorCategory(contractorId: number, category: string) {
  await db
    .delete(contractorCategories)
    .where(
      and(
        eq(contractorCategories.contractorId, contractorId),
        eq(contractorCategories.category, category)
      )
    );
}

export async function getContractorCategories(contractorId: number) {
  return db
    .select({ category: contractorCategories.category })
    .from(contractorCategories)
    .where(eq(contractorCategories.contractorId, contractorId));
}

export async function setContractorCategories(contractorId: number, categories: string[]) {
  await db.delete(contractorCategories).where(eq(contractorCategories.contractorId, contractorId));

  if (categories.length > 0) {
    await db
      .insert(contractorCategories)
      .values(categories.map((category) => ({ contractorId, category })));
  }
}

export async function setContractorServiceAreas(
  contractorId: number,
  areas: { cityId: number; neighborhoodId?: number }[]
) {
  await db.delete(contractorServiceAreas).where(eq(contractorServiceAreas.contractorId, contractorId));

  if (areas.length > 0) {
    await db
      .insert(contractorServiceAreas)
      .values(areas.map((area) => ({ contractorId, ...area })));
  }
}

export async function findMatchingContractors(cityId: number, category: string, limit: number = 3) {
  const matchingContractors = await db
    .select({
      id: contractors.id,
      companyName: contractors.companyName,
      email: contractors.email,
      phone: contractors.phone,
      leadsThisMonth: contractors.leadsThisMonth,
      monthlyLeadLimit: contractors.monthlyLeadLimit,
      leadCredits: contractors.leadCredits,
      billingPlan: contractors.billingPlan,
    })
    .from(contractors)
    .innerJoin(contractorServiceAreas, eq(contractors.id, contractorServiceAreas.contractorId))
    .innerJoin(contractorCategories, eq(contractors.id, contractorCategories.contractorId))
    .where(
      and(
        eq(contractors.status, 'active'),
        eq(contractorServiceAreas.cityId, cityId),
        eq(contractorServiceAreas.isActive, true),
        eq(contractorCategories.category, category),
        eq(contractorCategories.isActive, true)
      )
    )
    .groupBy(contractors.id)
    .limit(limit);

  return matchingContractors;
}

export async function getContractorLeadAssignments(
  contractorId: number,
  options: { limit?: number; offset?: number; status?: string } = {}
) {
  const { limit = 20, offset = 0, status } = options;

  let query = db
    .select()
    .from(leadAssignments)
    .where(
      status
        ? and(eq(leadAssignments.contractorId, contractorId), eq(leadAssignments.status, status))
        : eq(leadAssignments.contractorId, contractorId)
    )
    .orderBy(desc(leadAssignments.createdAt))
    .limit(limit)
    .offset(offset);

  return query;
}

export async function getContractorBillingHistory(
  contractorId: number,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;

  return db
    .select()
    .from(contractorBillingHistory)
    .where(eq(contractorBillingHistory.contractorId, contractorId))
    .orderBy(desc(contractorBillingHistory.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function createBillingRecord(data: {
  contractorId: number;
  type: string;
  amount: string;
  description?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  leadAssignmentId?: number;
  status?: string;
}) {
  const result = await db.insert(contractorBillingHistory).values(data).returning();
  return result[0];
}

export async function countContractorsInCity(cityId: number) {
  const result = await db
    .select({ count: sql<number>`count(distinct ${contractors.id})` })
    .from(contractors)
    .innerJoin(contractorServiceAreas, eq(contractors.id, contractorServiceAreas.contractorId))
    .where(
      and(
        eq(contractors.status, 'active'),
        eq(contractorServiceAreas.cityId, cityId),
        eq(contractorServiceAreas.isActive, true)
      )
    );
  return result[0]?.count ?? 0;
}

export async function getActiveContractorsByCity(cityId: number) {
  return db
    .select({
      id: contractors.id,
      companyName: contractors.companyName,
      slug: contractors.slug,
      description: contractors.description,
      logoUrl: contractors.logoUrl,
      yearsInBusiness: contractors.yearsInBusiness,
      insuranceVerified: contractors.insuranceVerified,
    })
    .from(contractors)
    .innerJoin(contractorServiceAreas, eq(contractors.id, contractorServiceAreas.contractorId))
    .where(
      and(
        eq(contractors.status, 'active'),
        eq(contractorServiceAreas.cityId, cityId),
        eq(contractorServiceAreas.isActive, true)
      )
    )
    .groupBy(contractors.id)
    .limit(50);
}

export async function getAllContractors(options: {
  limit?: number;
  offset?: number;
  status?: string;
} = {}) {
  const { limit = 50, offset = 0, status } = options;

  return db
    .select()
    .from(contractors)
    .where(status ? eq(contractors.status, status) : undefined)
    .orderBy(desc(contractors.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getContractorStats() {
  const [totalResult, activeResult, pendingResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(contractors),
    db.select({ count: sql<number>`count(*)` }).from(contractors).where(eq(contractors.status, 'active')),
    db.select({ count: sql<number>`count(*)` }).from(contractors).where(eq(contractors.status, 'pending')),
  ]);

  return {
    total: totalResult[0]?.count ?? 0,
    active: activeResult[0]?.count ?? 0,
    pending: pendingResult[0]?.count ?? 0,
  };
}

/**
 * Reset leadsThisMonth for subscription contractors whose lastLeadResetAt
 * is in a previous calendar month (or null). Called from the ETL cron.
 */
export async function resetMonthlyLeadCounters() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await db
    .update(contractors)
    .set({
      leadsThisMonth: 0,
      lastLeadResetAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(contractors.billingPlan, 'subscription'),
        sql`(${contractors.lastLeadResetAt} IS NULL OR ${contractors.lastLeadResetAt} < ${startOfMonth})`
      )
    )
    .returning({ id: contractors.id });

  return result.length;
}
