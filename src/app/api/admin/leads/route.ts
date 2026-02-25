import { NextRequest, NextResponse } from 'next/server';
import { safeQuery } from '@/lib/db/safe-query';
import { getLeadsPaginated } from '@/lib/db/queries/admin';
import { updateLeadStatus } from '@/lib/db/queries/leads';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
  const status = searchParams.get('status') || undefined;
  const cityId = searchParams.get('cityId')
    ? parseInt(searchParams.get('cityId')!, 10)
    : undefined;

  const result = await safeQuery(() =>
    getLeadsPaginated(page, pageSize, { status, cityId })
  );

  if (!result) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body as { id?: number; status?: string };

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['new', 'contacted', 'converted', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await safeQuery(() => updateLeadStatus(id, status));

    if (result === null) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
