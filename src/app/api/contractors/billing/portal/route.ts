import { NextRequest, NextResponse } from 'next/server';
import { safeQuery } from '@/lib/db/safe-query';
import { getContractorById } from '@/lib/db/queries/contractors';
import { validateContractorSessionToken, COOKIE_NAME } from '@/lib/auth/contractor-session';
import { createBillingPortalSession } from '@/lib/billing/stripe';
import { SITE_URL } from '@/lib/config/constants';

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

    const contractor = await safeQuery(() => getContractorById(contractorId));
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    if (!contractor.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account set up. Please add a payment method first.' },
        { status: 400 }
      );
    }

    const session = await createBillingPortalSession(
      contractor.stripeCustomerId,
      `${SITE_URL}/contractors/dashboard/billing`
    );

    return NextResponse.json({
      success: true,
      portalUrl: session.url,
    });
  } catch (error) {
    console.error('[billing-portal] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session.' },
      { status: 500 }
    );
  }
}
