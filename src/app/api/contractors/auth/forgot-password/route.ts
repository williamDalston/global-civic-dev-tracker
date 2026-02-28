import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeQuery } from '@/lib/db/safe-query';
import { getContractorByEmail, updateContractor } from '@/lib/db/queries/contractors';
import { generateToken } from '@/lib/auth/contractor-session';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const contractor = await safeQuery(() => getContractorByEmail(email));

    // Always return success to prevent email enumeration
    if (!contractor) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await safeQuery(() =>
      updateContractor(contractor.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      })
    );

    // TODO: Send password reset email via Resend
    // For now, log the token (in production, this would be sent via email)
    console.log(`[password-reset] Token for ${email}: ${resetToken}`);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('[forgot-password] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
