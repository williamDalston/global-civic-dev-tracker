import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeQuery } from '@/lib/db/safe-query';
import { db } from '@/lib/db';
import { leadAssignments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateContractorSessionToken, COOKIE_NAME } from '@/lib/auth/contractor-session';

const statusSchema = z.object({
  status: z.enum(['contacted', 'won', 'lost']),
  feedback: z.string().max(1000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const assignmentId = parseInt(id, 10);
    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { status, feedback } = parsed.data;

    const updateData: Record<string, unknown> = { status };

    if (status === 'contacted') {
      updateData.contactedAt = new Date();
    }

    if (feedback) {
      updateData.feedback = feedback;
    }

    const result = await safeQuery(() =>
      db
        .update(leadAssignments)
        .set(updateData)
        .where(
          and(
            eq(leadAssignments.id, assignmentId),
            eq(leadAssignments.contractorId, contractorId)
          )
        )
        .returning()
    );

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, assignment: result[0] });
  } catch (error) {
    console.error('[lead-status] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to update status.' },
      { status: 500 }
    );
  }
}
