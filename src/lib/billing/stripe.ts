import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });
  }
  return _stripe;
}

export const LEAD_PRICES: Record<string, number> = {
  'new-construction': 7500,
  demolition: 5000,
  renovation: 4000,
  plumbing: 3500,
  hvac: 3500,
  roofing: 3500,
  electrical: 3000,
  'fire-safety': 3000,
  mechanical: 2500,
  signage: 1500,
  general: 2500,
  other: 2000,
};

export function getLeadPrice(category: string): number {
  return LEAD_PRICES[category] ?? LEAD_PRICES.other;
}

export async function createStripeCustomer(data: {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const stripe = getStripe();
  return stripe.customers.create({
    email: data.email,
    name: data.name,
    phone: data.phone,
    metadata: data.metadata,
  });
}

export async function createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
  const stripe = getStripe();
  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });
}

export async function chargeForLead(data: {
  customerId: string;
  amount: number;
  description: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();

  const paymentMethods = await stripe.paymentMethods.list({
    customer: data.customerId,
    type: 'card',
    limit: 1,
  });

  if (paymentMethods.data.length === 0) {
    throw new Error('No payment method on file');
  }

  return stripe.paymentIntents.create({
    amount: data.amount,
    currency: 'usd',
    customer: data.customerId,
    payment_method: paymentMethods.data[0].id,
    off_session: true,
    confirm: true,
    description: data.description,
    metadata: data.metadata,
  });
}

export async function getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
  const stripe = getStripe();
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
  return paymentMethods.data;
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function createCheckoutSession(data: {
  customerId: string;
  successUrl: string;
  cancelUrl: string;
  mode: 'setup' | 'subscription' | 'payment';
  priceId?: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: data.customerId,
    success_url: data.successUrl,
    cancel_url: data.cancelUrl,
    mode: data.mode,
  };

  if (data.mode === 'setup') {
    sessionParams.payment_method_types = ['card'];
  } else if (data.mode === 'subscription' && data.priceId) {
    sessionParams.line_items = [{ price: data.priceId, quantity: 1 }];
  }

  return stripe.checkout.sessions.create(sessionParams);
}

export function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
}
