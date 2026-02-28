import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateContractorSessionToken, COOKIE_NAME } from '@/lib/auth/contractor-session';
import { db } from '@/lib/db';
import { contractors, contractorServiceAreas, contractorCategories, cities } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { normalizePhone } from '@/lib/utils/lead-validation';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { valid, contractorId } = validateContractorSessionToken(token, secret);
    if (!valid || !contractorId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const [contractor] = await db
      .select({
        id: contractors.id,
        companyName: contractors.companyName,
        contactName: contractors.contactName,
        email: contractors.email,
        phone: contractors.phone,
        website: contractors.website,
        description: contractors.description,
        licenseNumber: contractors.licenseNumber,
        yearsInBusiness: contractors.yearsInBusiness,
        employeeCount: contractors.employeeCount,
        slug: contractors.slug,
      })
      .from(contractors)
      .where(eq(contractors.id, contractorId))
      .limit(1);

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    // Get service areas with city names
    const serviceAreas = await db
      .select({
        citySlug: contractorServiceAreas.citySlug,
        cityName: cities.name,
      })
      .from(contractorServiceAreas)
      .leftJoin(cities, eq(cities.slug, contractorServiceAreas.citySlug))
      .where(eq(contractorServiceAreas.contractorId, contractorId));

    // Get categories
    const categoriesResult = await db
      .select({ category: contractorCategories.category })
      .from(contractorCategories)
      .where(eq(contractorCategories.contractorId, contractorId));

    return NextResponse.json({
      ...contractor,
      serviceAreas: serviceAreas.map((sa) => ({
        citySlug: sa.citySlug,
        cityName: sa.cityName || sa.citySlug,
      })),
      categories: categoriesResult.map((c) => c.category),
    });
  } catch (error) {
    console.error('[contractor-profile] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

const updateSchema = z.object({
  companyName: z.string().min(2).max(200),
  contactName: z.string().min(2).max(200),
  phone: z.string().min(7).max(30),
  website: z.string().url().max(500).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  licenseNumber: z.string().max(100).optional().or(z.literal('')),
  yearsInBusiness: z.number().min(0).max(100).nullable().optional(),
  employeeCount: z.enum(['1', '2-5', '6-10', '11-25', '26-50', '51-100', '100+']).optional().or(z.literal('')),
});

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { valid, contractorId } = validateContractorSessionToken(token, secret);
    if (!valid || !contractorId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { companyName, contactName, phone, website, description, licenseNumber, yearsInBusiness, employeeCount } = parsed.data;

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const [updated] = await db
      .update(contractors)
      .set({
        companyName,
        contactName,
        phone: normalizedPhone,
        website: website || null,
        description: description || null,
        licenseNumber: licenseNumber || null,
        yearsInBusiness: yearsInBusiness ?? null,
        employeeCount: employeeCount || null,
        updatedAt: new Date(),
      })
      .where(eq(contractors.id, contractorId))
      .returning({
        id: contractors.id,
        companyName: contractors.companyName,
        contactName: contractors.contactName,
        phone: contractors.phone,
        website: contractors.website,
        description: contractors.description,
        licenseNumber: contractors.licenseNumber,
        yearsInBusiness: contractors.yearsInBusiness,
        employeeCount: contractors.employeeCount,
        slug: contractors.slug,
      });

    return NextResponse.json({
      success: true,
      contractor: updated,
    });
  } catch (error) {
    console.error('[contractor-profile] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
