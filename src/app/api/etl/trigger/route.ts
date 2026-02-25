import { NextRequest, NextResponse } from 'next/server';
import { runFullETL } from '@/lib/etl/pipeline';
import { verifyAuth } from '@/lib/config/env';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!verifyAuth(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await runFullETL();

    const summary = results.map((r) => ({
      city: r.citySlug,
      processed: r.recordsProcessed,
      inserted: r.recordsInserted,
      errors: r.errors.length,
      duration: `${(r.duration / 1000).toFixed(1)}s`,
    }));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: summary,
    });
  } catch (error) {
    console.error('[etl] Trigger failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
