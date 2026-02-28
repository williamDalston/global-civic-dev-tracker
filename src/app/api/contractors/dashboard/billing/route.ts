import { NextRequest, NextResponse } from 'next/server';
import { safeQuery } from '@/lib/db/safe-query';
import { getContractorById, getContractorBillingHistory } from '@/lib/db/queries/contractors';
import { validateContractorSessionToken, COOKIE_NAME } from '@/lib/auth/contractor-session';

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

    const history = await safeQuery(() =>
      getContractorBillingHistory(contractorId, { limit: 50 })
    );

    return NextResponse.json({
      hasPaymentMethod: !!contractor.stripeCustomerId,
      billingPlan: contractor.billingPlan,
      history: history ?? [],
    });
  } catch (error) {
    console.error('[contractor-billing] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to load billing data.' },
      { status: 500 }
    );
  }
}
