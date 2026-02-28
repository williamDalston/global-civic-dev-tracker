'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BillingData {
  hasPaymentMethod: boolean;
  billingPlan: string;
  history: BillingRecord[];
}

interface BillingRecord {
  id: number;
  type: string;
  amount: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export default function ContractorBillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);

  const setupStatus = searchParams.get('setup');

  useEffect(() => {
    async function loadBilling() {
      try {
        const res = await fetch('/api/contractors/dashboard/billing');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/contractors/login');
            return;
          }
          throw new Error('Failed to load billing');
        }
        const data = await res.json();
        setBilling(data);
      } catch (error) {
        console.error('Failed to load billing:', error);
      } finally {
        setLoading(false);
      }
    }

    loadBilling();
  }, [router]);

  async function handleSetupPayment() {
    setSetupLoading(true);
    try {
      const res = await fetch('/api/contractors/billing/setup', { method: 'POST' });
      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Failed to setup payment:', error);
    } finally {
      setSetupLoading(false);
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch('/api/contractors/billing/portal', { method: 'POST' });
      const data = await res.json();

      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Payments</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your payment methods and view billing history
        </p>
      </div>

      {setupStatus === 'success' && (
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="p-4">
            <p className="font-medium text-green-200">
              Payment method added successfully! You&apos;re now ready to receive leads.
            </p>
          </CardContent>
        </Card>
      )}

      {setupStatus === 'cancelled' && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="p-4">
            <p className="font-medium text-amber-200">
              Payment setup was cancelled. Add a payment method to start receiving leads.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              {billing?.hasPaymentMethod
                ? 'Your payment method is on file'
                : 'Add a payment method to receive leads'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {billing?.hasPaymentMethod ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCardIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Card on file</p>
                    <p className="text-sm text-muted-foreground">
                      Manage your payment methods in the billing portal
                    </p>
                  </div>
                </div>
                <Button onClick={handleManageBilling} variant="outline" className="w-full">
                  Manage Payment Methods
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-amber-500/10 p-4">
                  <p className="text-sm text-amber-200">
                    You need a payment method on file to receive leads. You won&apos;t be charged
                    until you receive your first lead.
                  </p>
                </div>
                <Button onClick={handleSetupPayment} disabled={setupLoading} className="w-full">
                  {setupLoading ? 'Setting up...' : 'Add Payment Method'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Plan</CardTitle>
            <CardDescription>Current billing plan and pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {billing?.billingPlan === 'subscription' ? 'Monthly Subscription' : 'Pay Per Lead'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {billing?.billingPlan === 'subscription'
                      ? 'Unlimited leads for a flat monthly fee'
                      : 'Only pay when you receive a lead'}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">General/Signage leads</span>
                  <span className="font-medium">$15 - $25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renovation/Trade leads</span>
                  <span className="font-medium">$25 - $40</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New construction leads</span>
                  <span className="font-medium">$50 - $75</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent charges and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {!billing?.history || billing.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ReceiptIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-muted-foreground">No billing history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {billing.history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{record.description || record.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        record.status === 'completed'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : record.status === 'failed'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }
                    >
                      {record.status}
                    </Badge>
                    <span className="font-semibold">${record.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </svg>
  );
}
