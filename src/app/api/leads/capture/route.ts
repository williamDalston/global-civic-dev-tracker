import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeQuery } from '@/lib/db/safe-query';
import { createLead } from '@/lib/db/queries/leads';
import { getCityBySlug } from '@/lib/db/queries/cities';
import { getCityBySlug as getCityConfigBySlug } from '@/lib/config/cities';
import { sendLeadNotification } from '@/lib/email/send-lead-notification';

const MAX_BODY_SIZE = 8_000; // bytes

const leadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(20).optional(),
  message: z.string().max(2000).optional(),
  workType: z.string().max(100).optional(),
  permitId: z.number().optional(),
  citySlug: z.string().max(100).optional(),
  sourceUrl: z.string().url().max(2000).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  // Honeypot field — should be empty
  website: z.string().max(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Honeypot check — silently accept but don't save
    if (parsed.data.website) {
      return NextResponse.json({ success: true });
    }

    // Resolve cityId from slug
    let cityId: number | null = null;
    if (parsed.data.citySlug) {
      const dbCity = await safeQuery(() => getCityBySlug(parsed.data.citySlug!));
      if (dbCity) cityId = dbCity.id;
    }

    if (!cityId) {
      return NextResponse.json(
        { error: 'Could not resolve city. Please try again.' },
        { status: 400 }
      );
    }

    // Save to DB
    const lead = await safeQuery(() =>
      createLead({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        message: parsed.data.message,
        workType: parsed.data.workType,
        permitId: parsed.data.permitId,
        cityId,
        sourceUrl: parsed.data.sourceUrl,
        utmSource: parsed.data.utmSource,
        utmMedium: parsed.data.utmMedium,
      })
    );

    if (!lead) {
      console.warn('[leads] Failed to save lead — DB may be unavailable');
    }

    // Fire-and-forget email notification
    if (lead) {
      const cityConfig = getCityConfigBySlug(parsed.data.citySlug ?? '');
      const cityName = cityConfig?.name ?? parsed.data.citySlug ?? 'Unknown';
      sendLeadNotification({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        message: parsed.data.message,
        workType: parsed.data.workType,
        cityName,
        sourceUrl: parsed.data.sourceUrl,
      }).catch((err) => console.error('[email] Notification failed:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Your request has been submitted. Local contractors will reach out shortly.',
    });
  } catch (error) {
    console.error('[leads] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
