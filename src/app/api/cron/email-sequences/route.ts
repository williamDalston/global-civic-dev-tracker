import { NextRequest, NextResponse } from 'next/server';
import { processOnboardingSequence } from '@/lib/email/contractor-sequences';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processOnboardingSequence();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron-email-sequences] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process email sequences' },
      { status: 500 }
    );
  }
}
