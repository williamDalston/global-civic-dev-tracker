import { NextRequest, NextResponse } from 'next/server';
import { safeQuery } from '@/lib/db/safe-query';
import { db } from '@/lib/db';
import { leadAssignments, leads } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
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

    const assignments = await safeQuery(() =>
      db
        .select({
          id: leadAssignments.id,
          leadId: leadAssignments.leadId,
          status: leadAssignments.status,
          priceCharged: leadAssignments.priceCharged,
          createdAt: leadAssignments.createdAt,
          viewedAt: leadAssignments.viewedAt,
          contactedAt: leadAssignments.contactedAt,
          name: leads.name,
          email: leads.email,
          phone: leads.phone,
          message: leads.message,
          workType: leads.workType,
        })
        .from(leadAssignments)
        .innerJoin(leads, eq(leadAssignments.leadId, leads.id))
        .where(eq(leadAssignments.contractorId, contractorId))
        .orderBy(desc(leadAssignments.createdAt))
        .limit(100)
    );

    return NextResponse.json({
      leads: assignments ?? [],
    });
  } catch (error) {
    console.error('[contractor-leads] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to load leads.' },
      { status: 500 }
    );
  }
}
