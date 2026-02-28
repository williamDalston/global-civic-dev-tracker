import { Resend } from 'resend';
import { db } from '@/lib/db';
import { contractors } from '@/lib/db/schema';
import { eq, and, isNull, lte, sql } from 'drizzle-orm';
import { SITE_URL, SITE_NAME } from '@/lib/config/constants';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface EmailSequence {
  id: string;
  delayHours: number;
  subject: string;
  body: (contractor: { companyName: string; contactName: string }) => string;
}

const ONBOARDING_SEQUENCE: EmailSequence[] = [
  {
    id: 'welcome',
    delayHours: 0,
    subject: `Welcome to ${SITE_NAME}, {{companyName}}!`,
    body: (c) => `Hi ${c.contactName},

Welcome to ${SITE_NAME}! You're one step away from receiving qualified leads from homeowners in your area.

To start receiving leads, just add a payment method to your account. You won't be charged until you receive your first lead.

Complete your setup: ${SITE_URL}/contractors/dashboard/billing

Here's what happens next:
1. Add a payment method (takes 30 seconds)
2. Your account is automatically activated
3. Start receiving leads matched to your services

Questions? Just reply to this email.

Best,
${SITE_NAME} Team`,
  },
  {
    id: 'reminder_24h',
    delayHours: 24,
    subject: `{{companyName}}, homeowners are looking for contractors like you`,
    body: (c) => `Hi ${c.contactName},

Just a quick reminder - you signed up for ${SITE_NAME} but haven't added a payment method yet.

We currently have homeowners in your area looking for contractors. Don't miss out on these opportunities.

Add a payment method now: ${SITE_URL}/contractors/dashboard/billing

Remember:
- No monthly fees
- Only pay when you receive a lead ($15-75)
- Cancel anytime

Best,
${SITE_NAME} Team`,
  },
  {
    id: 'reminder_72h',
    delayHours: 72,
    subject: `Last chance: Complete your ${SITE_NAME} setup`,
    body: (c) => `Hi ${c.contactName},

This is your final reminder to complete your ${SITE_NAME} setup.

We've had several homeowners in your area request quotes this week. Without a payment method on file, we can't send you these leads.

It only takes 30 seconds: ${SITE_URL}/contractors/dashboard/billing

If you have any questions or concerns about the platform, just reply to this email. I'm happy to help.

Best,
${SITE_NAME} Team`,
  },
  {
    id: 'win_back_7d',
    delayHours: 168,
    subject: `We miss you, {{companyName}}`,
    body: (c) => `Hi ${c.contactName},

It's been a week since you signed up for ${SITE_NAME}, and we noticed you haven't completed your setup.

Is there something holding you back? Common concerns:

Q: "What if the leads are bad?"
A: We have a quality guarantee. If a lead is spam or has fake contact info, we'll refund you automatically.

Q: "How much will I actually pay?"
A: Lead prices range from $15-75 depending on project type. You only pay when you receive a lead.

Q: "Can I pause or cancel?"
A: Yes, anytime. No contracts, no commitments.

Ready to give it a try? ${SITE_URL}/contractors/dashboard/billing

Best,
${SITE_NAME} Team`,
  },
];

const INACTIVE_SEQUENCE: EmailSequence[] = [
  {
    id: 'inactive_30d',
    delayHours: 720,
    subject: `{{companyName}}, we have leads waiting for you`,
    body: (c) => `Hi ${c.contactName},

It's been a while since you've logged into ${SITE_NAME}. We wanted to let you know that homeowners in your area are still looking for contractors.

In the last 30 days, we've connected contractors with hundreds of qualified leads. Don't miss out on your share.

Log in and check your dashboard: ${SITE_URL}/contractors/dashboard

If you're no longer interested, no worries - you can update your preferences or deactivate your account anytime.

Best,
${SITE_NAME} Team`,
  },
];

export async function sendSequenceEmail(
  contractor: { id: number; email: string; companyName: string; contactName: string },
  sequence: EmailSequence
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    const subject = sequence.subject
      .replace('{{companyName}}', contractor.companyName)
      .replace('{{contactName}}', contractor.contactName);

    const body = sequence.body({
      companyName: contractor.companyName,
      contactName: contractor.contactName,
    });

    await resend.emails.send({
      from: `${SITE_NAME} <hello@alstonanalytics.com>`,
      to: contractor.email,
      subject,
      text: body,
      headers: {
        'X-Entity-Ref-ID': `sequence-${contractor.id}-${sequence.id}`,
      },
    });

    console.log(`[email-sequence] Sent ${sequence.id} to contractor ${contractor.id}`);
    return true;
  } catch (error) {
    console.error(`[email-sequence] Failed to send ${sequence.id}:`, error);
    return false;
  }
}

export async function processOnboardingSequence(): Promise<{
  processed: number;
  sent: number;
}> {
  let processed = 0;
  let sent = 0;

  // Find contractors without payment method
  const pendingContractors = await db
    .select({
      id: contractors.id,
      email: contractors.email,
      companyName: contractors.companyName,
      contactName: contractors.contactName,
      createdAt: contractors.createdAt,
    })
    .from(contractors)
    .where(
      and(
        isNull(contractors.stripeCustomerId),
        eq(contractors.status, 'pending')
      )
    )
    .limit(100);

  for (const contractor of pendingContractors) {
    if (!contractor.createdAt) continue;

    const hoursSinceSignup = Math.floor(
      (Date.now() - new Date(contractor.createdAt).getTime()) / (1000 * 60 * 60)
    );

    // Find the appropriate email in the sequence
    for (const sequence of ONBOARDING_SEQUENCE) {
      // Check if it's time to send this email (within a 2-hour window)
      if (
        hoursSinceSignup >= sequence.delayHours &&
        hoursSinceSignup < sequence.delayHours + 2
      ) {
        processed++;
        const success = await sendSequenceEmail(
          {
            id: contractor.id,
            email: contractor.email,
            companyName: contractor.companyName,
            contactName: contractor.contactName,
          },
          sequence
        );
        if (success) sent++;
        break;
      }
    }
  }

  return { processed, sent };
}

export async function sendWelcomeEmail(contractor: {
  id: number;
  email: string;
  companyName: string;
  contactName: string;
}): Promise<boolean> {
  return sendSequenceEmail(contractor, ONBOARDING_SEQUENCE[0]);
}
