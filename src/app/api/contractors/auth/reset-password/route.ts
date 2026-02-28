import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeQuery } from '@/lib/db/safe-query';
import { getContractorByPasswordResetToken, updateContractor } from '@/lib/db/queries/contractors';
import { hashPassword } from '@/lib/auth/contractor-session';

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request. Please use the link from your email.' },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const contractor = await safeQuery(() => getContractorByPasswordResetToken(token));
    if (!contractor) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    if (contractor.passwordResetExpires && new Date(contractor.passwordResetExpires) < new Date()) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await safeQuery(() =>
      updateContractor(contractor.id, {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('[reset-password] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
