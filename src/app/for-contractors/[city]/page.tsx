import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SITE_NAME, SITE_URL, PERMIT_CATEGORIES } from '@/lib/config/constants';
import { getCityBySlug, CITIES } from '@/lib/config/cities';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    return { title: 'City Not Found' };
  }

  const title = `Get Contractor Leads in ${city.name} | ${SITE_NAME}`;
  const description = `Looking for contractor leads in ${city.name}? Get qualified leads from homeowners searching for contractors. Pay only for leads you receive. Join free today.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/for-contractors/${citySlug}`,
      siteName: SITE_NAME,
      type: 'website',
    },
  };
}

const SERVICES = [
  { key: 'new-construction', demand: 'High' },
  { key: 'renovation', demand: 'Very High' },
  { key: 'electrical', demand: 'High' },
  { key: 'plumbing', demand: 'Very High' },
  { key: 'hvac', demand: 'High' },
  { key: 'roofing', demand: 'Medium' },
];

export default async function ForContractorsCityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <Link
            href="/for-contractors"
            className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← All Cities
          </Link>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Get Contractor Leads in
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              {city.name}
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Homeowners in {city.name} are actively searching for contractors on our platform.
            Join free and start receiving qualified leads matched to your services.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link href="/contractors/signup">
              <Button size="lg" className="h-12 px-6">
                Join Free — Get {city.name} Leads
              </Button>
            </Link>
            <Link href="/contractors/login">
              <Button size="lg" variant="outline" className="h-12 px-6">
                Already a member? Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Demand by Service */}
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">Lead Demand in {city.name}</h2>
          <p className="mt-2 text-muted-foreground">
            Current demand for contractor services based on homeowner searches
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <Card key={service.key} className="border-border">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{PERMIT_CATEGORIES[service.key]}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.key === 'new-construction' ? '$50-75' : service.key === 'renovation' ? '$30-45' : '$25-40'} per lead
                    </p>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      service.demand === 'Very High'
                        ? 'bg-green-500/10 text-green-500'
                        : service.demand === 'High'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                    }`}
                  >
                    {service.demand} Demand
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why This City */}
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">Why {city.name}?</h2>

          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div>
              <div className="text-4xl font-bold text-primary">1000+</div>
              <p className="mt-2 text-muted-foreground">
                Building permits tracked monthly in {city.name}
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">Active</div>
              <p className="mt-2 text-muted-foreground">
                Homeowners browsing permits and requesting quotes daily
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">Growing</div>
              <p className="mt-2 text-muted-foreground">
                Construction activity increasing year over year
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">How to Get Leads in {city.name}</h2>

          <div className="mt-8 space-y-6">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </div>
              <div>
                <h3 className="font-semibold">Sign up and select {city.name} as your service area</h3>
                <p className="mt-1 text-muted-foreground">
                  Create your free account and choose the services you offer
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h3 className="font-semibold">Add a payment method</h3>
                <p className="mt-1 text-muted-foreground">
                  You won&apos;t be charged until you receive your first lead
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h3 className="font-semibold">Receive leads from {city.name} homeowners</h3>
                <p className="mt-1 text-muted-foreground">
                  Get instant email notifications with full contact details
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold">Start Getting {city.name} Leads Today</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Join contractors already growing their business with leads from {city.name}.
            Sign up is free and takes less than 2 minutes.
          </p>

          <div className="mt-8">
            <Link href="/contractors/signup">
              <Button size="lg" className="h-14 px-8 text-lg">
                Join Free — Get {city.name} Leads
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
