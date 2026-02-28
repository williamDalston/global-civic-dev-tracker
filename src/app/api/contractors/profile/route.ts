import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeQuery } from '@/lib/db/safe-query';
import {
  getContractorById,
  updateContractor,
  setContractorCategories,
  setContractorServiceAreas,
  getContractorCategories,
  getContractorServiceAreas,
} from '@/lib/db/queries/contractors';
import { validateContractorSessionToken, COOKIE_NAME } from '@/lib/auth/contractor-session';

const profileSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  contactName: z.string().min(1).max(200).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  licenseNumber: z.string().max(100).optional(),
  yearsInBusiness: z.number().int().min(0).max(200).optional(),
  employeeCount: z.string().max(50).optional(),
  categories: z.array(z.string()).min(1).optional(),
  cityIds: z.array(z.number()).min(1).optional(),
});

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

    const contractor = await safeQuery(() => getContractorById(contractorId));
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const [categories, serviceAreas] = await Promise.all([
      safeQuery(() => getContractorCategories(contractorId)),
      safeQuery(() => getContractorServiceAreas(contractorId)),
    ]);

    return NextResponse.json({
      contractor: {
        id: contractor.id,
        email: contractor.email,
        companyName: contractor.companyName,
        contactName: contractor.contactName,
        phone: contractor.phone,
        website: contractor.website,
        description: contractor.description,
        licenseNumber: contractor.licenseNumber,
        yearsInBusiness: contractor.yearsInBusiness,
        employeeCount: contractor.employeeCount,
        status: contractor.status,
      },
      categories: categories?.map((c) => c.category) ?? [],
      serviceAreas: serviceAreas ?? [],
    });
  } catch (error) {
    console.error('[contractor-profile] GET error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { categories, cityIds, ...profileFields } = parsed.data;

    if (Object.keys(profileFields).length > 0) {
      await safeQuery(() => updateContractor(contractorId, profileFields));
    }

    if (categories) {
      await safeQuery(() => setContractorCategories(contractorId, categories));
    }

    if (cityIds) {
      await safeQuery(() =>
        setContractorServiceAreas(
          contractorId,
          cityIds.map((cityId) => ({ cityId }))
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[contractor-profile] PATCH error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
