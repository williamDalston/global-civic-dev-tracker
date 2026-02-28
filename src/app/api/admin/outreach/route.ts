import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { validateSessionToken, COOKIE_NAME } from '@/lib/auth/admin-session';
import { runOutreachCampaign, findContractorsInCity } from '@/lib/ai/contractor-outreach';

const outreachSchema = z.object({
  city: z.string().min(1),
  serviceType: z.string().min(1),
  dryRun: z.boolean().default(true),
  limit: z.number().min(1).max(50).default(10),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const secret = process.env.CRON_SECRET;

    if (!token || !secret || !validateSessionToken(token, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = outreachSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { city, serviceType, dryRun, limit } = parsed.data;

    // Find contractors
    const prospects = await findContractorsInCity(city, serviceType);

    if (prospects.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No contractors found. Make sure GOOGLE_PLACES_API_KEY is configured.',
        results: [],
      });
    }

    // Run campaign
    const results = await runOutreachCampaign(prospects.slice(0, limit), { dryRun });

    return NextResponse.json({
      success: true,
      dryRun,
      totalProspects: prospects.length,
      processed: results.length,
      emailsSent: results.filter((r) => r.emailSent).length,
      results: results.map((r) => ({
        name: r.prospect.name,
        email: r.prospect.email,
        sent: r.emailSent,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error('[admin-outreach] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to run outreach campaign.' },
      { status: 500 }
    );
  }
}

// Manual prospect submission
const manualProspectSchema = z.object({
  prospects: z.array(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      city: z.string().min(1),
      services: z.array(z.string()).default(['general']),
    })
  ),
  dryRun: z.boolean().default(true),
});

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const secret = process.env.CRON_SECRET;

    if (!token || !secret || !validateSessionToken(token, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = manualProspectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prospects, dryRun } = parsed.data;

    const results = await runOutreachCampaign(prospects, { dryRun });

    return NextResponse.json({
      success: true,
      dryRun,
      processed: results.length,
      emailsSent: results.filter((r) => r.emailSent).length,
      results: results.map((r) => ({
        name: r.prospect.name,
        email: r.prospect.email,
        sent: r.emailSent,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error('[admin-outreach] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to send outreach emails.' },
      { status: 500 }
    );
  }
}
