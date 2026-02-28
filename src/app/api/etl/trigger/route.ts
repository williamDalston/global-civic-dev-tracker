import { NextRequest, NextResponse } from 'next/server';
import { runFullETL } from '@/lib/etl/pipeline';
import { runPostETLHooks } from '@/lib/etl/post-run';
import { verifyAuth } from '@/lib/config/env';
import { resetMonthlyLeadCounters } from '@/lib/db/queries/contractors';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!verifyAuth(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Reset monthly lead counters for subscription contractors
    try {
      const resetCount = await resetMonthlyLeadCounters();
      if (resetCount > 0) {
        console.log(`[etl] Reset monthly lead counters for ${resetCount} contractors`);
      }
    } catch (err) {
      console.error('[etl] Monthly lead reset failed:', err);
    }

    const results = await runFullETL();

    // Fire-and-forget post-ETL hooks (IndexNow, ISR revalidation, narrative generation)
    runPostETLHooks(results).catch((err) =>
      console.error('[etl] Post-run hooks failed:', err)
    );

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
