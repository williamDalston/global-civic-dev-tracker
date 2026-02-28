import { NextRequest, NextResponse } from 'next/server';
import { safeQuery } from '@/lib/db/safe-query';
import { db } from '@/lib/db';
import { leadAssignments, contractorBillingHistory } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
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

    const [totalLeadsResult] = await safeQuery(() =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(leadAssignments)
        .where(eq(leadAssignments.contractorId, contractorId))
    ) ?? [{ count: 0 }];

    const [newLeadsResult] = await safeQuery(() =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(leadAssignments)
        .where(
          and(
            eq(leadAssignments.contractorId, contractorId),
            eq(leadAssignments.status, 'paid')
          )
        )
    ) ?? [{ count: 0 }];

    const [pendingResult] = await safeQuery(() =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(leadAssignments)
        .where(
          and(
            eq(leadAssignments.contractorId, contractorId),
            eq(leadAssignments.status, 'pending')
          )
        )
    ) ?? [{ count: 0 }];

    const [totalSpentResult] = await safeQuery(() =>
      db
        .select({ total: sql<string>`coalesce(sum(amount), 0)` })
        .from(contractorBillingHistory)
        .where(
          and(
            eq(contractorBillingHistory.contractorId, contractorId),
            eq(contractorBillingHistory.status, 'completed')
          )
        )
    ) ?? [{ total: '0' }];

    const totalSpent = parseFloat(totalSpentResult?.total ?? '0');

    return NextResponse.json({
      totalLeads: totalLeadsResult?.count ?? 0,
      newLeads: newLeadsResult?.count ?? 0,
      pendingPayment: pendingResult?.count ?? 0,
      totalSpent: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(totalSpent),
    });
  } catch (error) {
    console.error('[contractor-stats] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to load stats.' },
      { status: 500 }
    );
  }
}
