import { NextRequest, NextResponse } from 'next/server';
import { safeQuery } from '@/lib/db/safe-query';
import { getContractorById, updateContractor } from '@/lib/db/queries/contractors';
import { validateContractorSessionToken, COOKIE_NAME } from '@/lib/auth/contractor-session';
import { createStripeCustomer, createCheckoutSession } from '@/lib/billing/stripe';
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

    let stripeCustomerId = contractor.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await createStripeCustomer({
        email: contractor.email,
        name: contractor.companyName,
        phone: contractor.phone,
        metadata: {
          contractorId: contractor.id.toString(),
          companyName: contractor.companyName,
        },
      });

      stripeCustomerId = customer.id;

      await safeQuery(() =>
        updateContractor(contractorId, {
          stripeCustomerId: customer.id,
        })
      );
    }

    const session = await createCheckoutSession({
      customerId: stripeCustomerId,
      successUrl: `${SITE_URL}/contractors/dashboard/billing?setup=success`,
      cancelUrl: `${SITE_URL}/contractors/dashboard/billing?setup=cancelled`,
      mode: 'setup',
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('[billing-setup] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing setup session.' },
      { status: 500 }
    );
  }
}
