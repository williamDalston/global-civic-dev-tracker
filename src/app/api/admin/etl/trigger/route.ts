import { NextResponse } from 'next/server';
import { runFullETL } from '@/lib/etl/pipeline';

export const maxDuration = 300;

/**
 * Admin proxy for ETL trigger.
 * The middleware already validates the admin session cookie,
 * so this route just runs the ETL directly without needing Bearer auth.
 */
export async function POST() {
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
    console.error('[admin/etl] Trigger failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
