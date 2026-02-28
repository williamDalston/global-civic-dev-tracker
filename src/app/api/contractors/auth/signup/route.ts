import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeQuery } from '@/lib/db/safe-query';
import {
  createContractor,
  getContractorByEmail,
} from '@/lib/db/queries/contractors';
import {
  hashPassword,
  generateToken,
  createContractorSessionToken,
  COOKIE_NAME,
} from '@/lib/auth/contractor-session';
import { isDisposableEmail, isValidEmailDomain, normalizePhone } from '@/lib/utils/lead-validation';
import slugify from 'slugify';

const signupSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(100),
  companyName: z.string().min(2).max(200),
  contactName: z.string().min(2).max(200),
  phone: z.string().min(7).max(30),
  website: z.string().url().max(500).optional().or(z.literal('')),
  licenseNumber: z.string().max(100).optional(),
  yearsInBusiness: z.number().min(0).max(100).optional(),
  employeeCount: z.enum(['1', '2-5', '6-10', '11-25', '26-50', '51-100', '100+']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, companyName, contactName, phone, website, licenseNumber, yearsInBusiness, employeeCount } = parsed.data;

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: 'Please use a business email address, not a disposable one.' },
        { status: 400 }
      );
    }

    if (!isValidEmailDomain(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number.' },
        { status: 400 }
      );
    }

    const existingContractor = await safeQuery(() => getContractorByEmail(email));
    if (existingContractor) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const emailVerifyToken = generateToken();

    let baseSlug = slugify(companyName, { lower: true, strict: true });
    let slug = baseSlug;
    let suffix = 1;

    while (true) {
      const existing = await safeQuery(async () => {
        const { getContractorBySlug } = await import('@/lib/db/queries/contractors');
        return getContractorBySlug(slug);
      });
      if (!existing) break;
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const contractor = await safeQuery(() =>
      createContractor({
        email,
        passwordHash,
        companyName,
        contactName,
        phone: normalizedPhone,
        slug,
        website: website || undefined,
        licenseNumber: licenseNumber || undefined,
        yearsInBusiness,
        employeeCount,
        emailVerifyToken,
      })
    );

    if (!contractor) {
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    const secret = process.env.CRON_SECRET;
    if (!secret) {
      console.error('[contractor-signup] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error.' },
        { status: 500 }
      );
    }

    const sessionToken = createContractorSessionToken(contractor.id, secret);

    // Send welcome email asynchronously
    import('@/lib/email/contractor-sequences').then(({ sendWelcomeEmail }) => {
      sendWelcomeEmail({
        id: contractor.id,
        email: contractor.email,
        companyName: contractor.companyName,
        contactName: contractor.contactName,
      }).catch((err) => console.error('[contractor-signup] Welcome email failed:', err));
    });

    const response = NextResponse.json({
      success: true,
      contractor: {
        id: contractor.id,
        email: contractor.email,
        companyName: contractor.companyName,
        slug: contractor.slug,
        status: contractor.status,
      },
    });

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[contractor-signup] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
