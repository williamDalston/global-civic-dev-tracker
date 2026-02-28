import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeQuery } from '@/lib/db/safe-query';
import {
  getContractorById,
  updateContractor,
  setContractorCategories,
  setContractorServiceAreas,
} from '@/lib/db/queries/contractors';
import { validateContractorSessionToken, COOKIE_NAME } from '@/lib/auth/contractor-session';

const onboardingSchema = z.object({
  categories: z.array(z.string()).min(1, 'Select at least one service category'),
  cityIds: z.array(z.number()).min(1, 'Select at least one service area'),
});

export async function POST(request: NextRequest) {
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

    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { categories, cityIds } = parsed.data;

    const contractor = await safeQuery(() => getContractorById(contractorId));
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    await safeQuery(() => setContractorCategories(contractorId, categories));

    await safeQuery(() =>
      setContractorServiceAreas(
        contractorId,
        cityIds.map((cityId) => ({ cityId }))
      )
    );

    await safeQuery(() =>
      updateContractor(contractorId, {
        status: 'active',
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Onboarding complete! You will now receive leads matching your preferences.',
    });
  } catch (error) {
    console.error('[contractor-onboarding] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
