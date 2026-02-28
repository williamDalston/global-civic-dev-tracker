import { NextRequest, NextResponse } from 'next/server';
import { safeQuery } from '@/lib/db/safe-query';
import { getContractorById } from '@/lib/db/queries/contractors';
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

    return NextResponse.json({
      contractor: {
        id: contractor.id,
        email: contractor.email,
        companyName: contractor.companyName,
        contactName: contractor.contactName,
        phone: contractor.phone,
        website: contractor.website,
        description: contractor.description,
        logoUrl: contractor.logoUrl,
        slug: contractor.slug,
        licenseNumber: contractor.licenseNumber,
        insuranceVerified: contractor.insuranceVerified,
        yearsInBusiness: contractor.yearsInBusiness,
        employeeCount: contractor.employeeCount,
        status: contractor.status,
        billingPlan: contractor.billingPlan,
        leadCredits: contractor.leadCredits,
        monthlyLeadLimit: contractor.monthlyLeadLimit,
        leadsThisMonth: contractor.leadsThisMonth,
        emailVerified: contractor.emailVerified,
        createdAt: contractor.createdAt,
      },
    });
  } catch (error) {
    console.error('[contractor-me] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
