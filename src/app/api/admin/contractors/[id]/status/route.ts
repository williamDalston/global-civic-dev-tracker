import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { safeQuery } from '@/lib/db/safe-query';
import { updateContractor } from '@/lib/db/queries/contractors';
import { validateSessionToken, COOKIE_NAME } from '@/lib/auth/admin-session';

const statusSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const secret = process.env.CRON_SECRET;

    if (!token || !secret || !validateSessionToken(token, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const contractorId = parseInt(id, 10);

    if (isNaN(contractorId)) {
      return NextResponse.json({ error: 'Invalid contractor ID' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const { status } = parsed.data;

    const result = await safeQuery(() =>
      updateContractor(contractorId, { status })
    );

    if (!result) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      contractor: {
        id: result.id,
        status: result.status,
      },
    });
  } catch (error) {
    console.error('[admin-contractor-status] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to update contractor status.' },
      { status: 500 }
    );
  }
}
