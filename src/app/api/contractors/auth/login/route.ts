import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeQuery } from '@/lib/db/safe-query';
import { getContractorByEmail } from '@/lib/db/queries/contractors';
import {
  verifyPassword,
  createContractorSessionToken,
  COOKIE_NAME,
} from '@/lib/auth/contractor-session';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please enter a valid email and password.' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const contractor = await safeQuery(() => getContractorByEmail(email));
    if (!contractor) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, contractor.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const secret = process.env.CRON_SECRET;
    if (!secret) {
      console.error('[contractor-login] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error.' },
        { status: 500 }
      );
    }

    const sessionToken = createContractorSessionToken(contractor.id, secret);

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
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[contractor-login] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
