import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/billing/stripe';
import { safeQuery } from '@/lib/db/safe-query';
import { db } from '@/lib/db';
import { contractors, leadAssignments, contractorBillingHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'setup' && session.customer) {
          const customerId = session.customer as string;
          console.log(`[stripe-webhook] Payment method setup completed for customer ${customerId}`);

          // Auto-approve contractor when they add a payment method
          const contractor = await safeQuery(() =>
            db.select().from(contractors).where(eq(contractors.stripeCustomerId, customerId)).limit(1)
          );

          if (contractor && contractor[0] && contractor[0].status === 'pending') {
            await safeQuery(() =>
              db
                .update(contractors)
                .set({ status: 'active' })
                .where(eq(contractors.id, contractor[0].id))
            );
            console.log(`[stripe-webhook] Auto-approved contractor ${contractor[0].id} after payment setup`);
          }
        }
        break;
      }

      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        const customerId = setupIntent.customer as string;

        if (customerId) {
          // Auto-approve contractor when they add a payment method via setup intent
          const contractor = await safeQuery(() =>
            db.select().from(contractors).where(eq(contractors.stripeCustomerId, customerId)).limit(1)
          );

          if (contractor && contractor[0] && contractor[0].status === 'pending') {
            await safeQuery(() =>
              db
                .update(contractors)
                .set({ status: 'active' })
                .where(eq(contractors.id, contractor[0].id))
            );
            console.log(`[stripe-webhook] Auto-approved contractor ${contractor[0].id} after setup intent`);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const leadAssignmentId = paymentIntent.metadata?.leadAssignmentId;

        if (leadAssignmentId) {
          await safeQuery(() =>
            db
              .update(leadAssignments)
              .set({ status: 'paid', paidAt: new Date() })
              .where(eq(leadAssignments.id, parseInt(leadAssignmentId, 10)))
          );

          await safeQuery(() =>
            db
              .update(contractorBillingHistory)
              .set({ status: 'completed' })
              .where(eq(contractorBillingHistory.stripePaymentIntentId, paymentIntent.id))
          );

          console.log(`[stripe-webhook] Lead ${leadAssignmentId} payment succeeded`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const leadAssignmentId = paymentIntent.metadata?.leadAssignmentId;
        const contractorIdStr = paymentIntent.metadata?.contractorId;

        if (leadAssignmentId) {
          await safeQuery(() =>
            db
              .update(leadAssignments)
              .set({ status: 'payment_failed' })
              .where(eq(leadAssignments.id, parseInt(leadAssignmentId, 10)))
          );

          await safeQuery(() =>
            db
              .update(contractorBillingHistory)
              .set({ status: 'failed' })
              .where(eq(contractorBillingHistory.stripePaymentIntentId, paymentIntent.id))
          );

          console.warn(`[stripe-webhook] Lead ${leadAssignmentId} payment failed`);
        }

        if (contractorIdStr) {
          console.warn(`[stripe-webhook] Payment failed for contractor ${contractorIdStr}`);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const contractor = await safeQuery(() =>
          db.select().from(contractors).where(eq(contractors.stripeCustomerId, customerId)).limit(1)
        );

        if (contractor && contractor[0]) {
          await safeQuery(() =>
            db
              .update(contractors)
              .set({
                stripeSubscriptionId: subscription.id,
                billingPlan: subscription.status === 'active' ? 'subscription' : 'per_lead',
              })
              .where(eq(contractors.id, contractor[0].id))
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const contractor = await safeQuery(() =>
          db.select().from(contractors).where(eq(contractors.stripeCustomerId, customerId)).limit(1)
        );

        if (contractor && contractor[0]) {
          await safeQuery(() =>
            db
              .update(contractors)
              .set({
                stripeSubscriptionId: null,
                billingPlan: 'per_lead',
              })
              .where(eq(contractors.id, contractor[0].id))
          );
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[stripe-webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
