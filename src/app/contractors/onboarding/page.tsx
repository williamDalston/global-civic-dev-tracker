'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { PERMIT_CATEGORIES } from '@/lib/config/constants';

type Step = 'categories' | 'areas' | 'billing';

interface City {
  id: number;
  name: string;
  slug: string;
  countryName: string;
}

const CITIES: City[] = [
  { id: 1, name: 'Washington DC', slug: 'washington-dc', countryName: 'United States' },
  { id: 2, name: 'New York City', slug: 'new-york-city', countryName: 'United States' },
  { id: 3, name: 'Chicago', slug: 'chicago', countryName: 'United States' },
  { id: 4, name: 'London', slug: 'london', countryName: 'United Kingdom' },
  { id: 5, name: 'Sydney', slug: 'sydney', countryName: 'Australia' },
  { id: 6, name: 'Toronto', slug: 'toronto', countryName: 'Canada' },
];

const categoryDescriptions: Record<string, string> = {
  'new-construction': 'New buildings, additions, ground-up construction',
  renovation: 'Remodeling, interior renovations, upgrades',
  demolition: 'Tear-downs, structural removal',
  electrical: 'Wiring, panels, electrical systems',
  plumbing: 'Pipes, fixtures, water systems',
  hvac: 'Heating, cooling, ventilation',
  roofing: 'Roof repairs, replacements, installations',
  mechanical: 'Elevators, escalators, mechanical systems',
  'fire-safety': 'Sprinklers, alarms, fire suppression',
  signage: 'Business signs, billboards, displays',
  general: 'General contracting, multiple trades',
};

export default function ContractorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('categories');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/contractors/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/contractors/login');
        }
      })
      .catch(() => router.push('/contractors/login'));
  }, [router]);

  function toggleCategory(category: string) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  function toggleCity(cityId: number) {
    setSelectedCities((prev) =>
      prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId]
    );
  }

  async function handleComplete() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contractors/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: selectedCategories,
          cityIds: selectedCities,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/contractors/dashboard');
      } else {
        setError(data.error || 'Failed to complete onboarding');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { id: 'categories', label: 'Services' },
    { id: 'areas', label: 'Service Areas' },
    { id: 'billing', label: 'Billing' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background py-8">
      <div className="w-full max-w-2xl px-4">
        {/* Progress Steps */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                    step === s.id
                      ? 'bg-primary text-primary-foreground'
                      : steps.findIndex((x) => x.id === step) > i
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    'ml-2 text-sm font-medium',
                    step === s.id ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className="mx-4 h-px w-8 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 'categories' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">What services do you offer?</CardTitle>
              <CardDescription>
                Select all the permit categories you work with. You&apos;ll receive leads matching these services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(PERMIT_CATEGORIES)
                  .filter(([key]) => key !== 'other' && key !== 'elevator' && key !== 'boiler')
                  .map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleCategory(key)}
                      className={cn(
                        'flex flex-col items-start rounded-lg border p-4 text-left transition-colors',
                        selectedCategories.includes(key)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <span className="font-medium">{label}</span>
                      {categoryDescriptions[key] && (
                        <span className="mt-1 text-xs text-muted-foreground">
                          {categoryDescriptions[key]}
                        </span>
                      )}
                    </button>
                  ))}
              </div>

              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setStep('areas')}
                  disabled={selectedCategories.length === 0}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'areas' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Where do you work?</CardTitle>
              <CardDescription>
                Select the cities where you want to receive leads. You can add more later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {CITIES.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => toggleCity(city.id)}
                    className={cn(
                      'flex flex-col items-start rounded-lg border p-4 text-left transition-colors',
                      selectedCities.includes(city.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="font-medium">{city.name}</span>
                    <span className="text-xs text-muted-foreground">{city.countryName}</span>
                  </button>
                ))}
              </div>

              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep('categories')}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep('billing')}
                  disabled={selectedCities.length === 0}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'billing' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Choose your plan</CardTitle>
              <CardDescription>
                Start with pay-per-lead and only pay for the leads you receive.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-primary bg-primary/5 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Pay Per Lead</h3>
                      <p className="text-sm text-muted-foreground">
                        Only pay when you receive a qualified lead
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">$15-75</div>
                      <div className="text-xs text-muted-foreground">per lead</div>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      No monthly fees or commitments
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Lead prices vary by project type
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Leads sent to max 3 contractors
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Dispute protection for bad leads
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-border p-6 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Monthly Subscription</h3>
                      <p className="text-sm text-muted-foreground">
                        Unlimited leads for a flat monthly fee
                      </p>
                    </div>
                    <div className="rounded bg-muted px-2 py-1 text-xs font-medium">
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>No payment required now.</strong> You&apos;ll add a payment method when you receive your first lead.
                  We&apos;ll send you an email with lead details and you can choose to accept or pass.
                </p>
              </div>

              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep('areas')}>
                  Back
                </Button>
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
