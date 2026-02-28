import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeQuery } from '@/lib/db/safe-query';
import { createLead, findRecentDuplicateLead } from '@/lib/db/queries/leads';
import { getCityBySlug } from '@/lib/db/queries/cities';
import { getCityBySlug as getCityConfigBySlug } from '@/lib/config/cities';
import { sendLeadNotification } from '@/lib/email/send-lead-notification';
import { isDisposableEmail, isValidEmailDomain, normalizePhone } from '@/lib/utils/lead-validation';
import { routeLeadToContractors } from '@/lib/leads/router';

const MAX_BODY_SIZE = 8_000; // bytes

const leadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(30).optional(),
  message: z.string().max(2000).optional(),
  workType: z.string().max(100).optional(),
  permitId: z.number().optional(),
  citySlug: z.string().max(100).optional(),
  sourceUrl: z.string().url().max(2000).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  consent: z.boolean(),
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

    // Consent is required
    if (!parsed.data.consent) {
      return NextResponse.json(
        { error: 'You must agree to be contacted by contractors.' },
        { status: 400 }
      );
    }

    // Spam hardening: reject disposable email domains
    if (isDisposableEmail(parsed.data.email)) {
      return NextResponse.json(
        { error: 'Please use a permanent email address, not a disposable one.' },
        { status: 400 }
      );
    }

    // Spam hardening: verify email domain structure
    if (!isValidEmailDomain(parsed.data.email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = parsed.data.phone ? normalizePhone(parsed.data.phone) : undefined;
    if (parsed.data.phone && !normalizedPhone) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number.' },
        { status: 400 }
      );
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

    // Spam hardening: duplicate detection (same email + city within 24 hours)
    const duplicate = await safeQuery(() =>
      findRecentDuplicateLead(parsed.data.email, cityId!)
    );
    if (duplicate) {
      // Accept gracefully but don't create a new row
      return NextResponse.json({
        success: true,
        message: 'Your request has been submitted. Local contractors will reach out shortly.',
      });
    }

    // Save to DB
    const lead = await safeQuery(() =>
      createLead({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: normalizedPhone ?? undefined,
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

    // Fire-and-forget email notification to admin
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
      }).catch((err) => console.error('[email] Admin notification failed:', err));

      // Route lead to matching contractors (fire-and-forget)
      routeLeadToContractors(lead.id).then((result) => {
        if (result.success) {
          console.log(`[leads] Lead ${lead.id} routed to ${result.assignedContractors.length} contractors`);
        } else {
          console.warn(`[leads] Lead ${lead.id} routing issues:`, result.errors);
        }
      }).catch((err) => console.error('[leads] Lead routing failed:', err));
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
