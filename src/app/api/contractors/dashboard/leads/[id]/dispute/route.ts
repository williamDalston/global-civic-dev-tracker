import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateContractorSessionToken, COOKIE_NAME } from '@/lib/auth/contractor-session';
import { processDispute } from '@/lib/ai/dispute-resolver';

const disputeSchema = z.object({
  reason: z.string().min(10).max(1000),
});

export async function POST(
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

    const parsed = disputeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please provide a detailed reason for the dispute (at least 10 characters)' },
        { status: 400 }
      );
    }

    const result = await processDispute({
      leadAssignmentId: assignmentId,
      contractorId,
      disputeReason: parsed.data.reason,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[lead-dispute] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to process dispute.' },
      { status: 500 }
    );
  }
}
