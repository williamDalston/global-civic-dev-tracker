import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SITE_NAME, SITE_URL } from '@/lib/config/constants';
import { CITIES } from '@/lib/config/cities';

export const metadata: Metadata = {
  title: `Get Contractor Leads | Join ${SITE_NAME}`,
  description:
    'Get qualified leads from homeowners looking for contractors in your area. No monthly fees - only pay for leads you receive. Join thousands of contractors growing their business.',
  openGraph: {
    title: `Get Contractor Leads | Join ${SITE_NAME}`,
    description:
      'Get qualified leads from homeowners looking for contractors in your area. No monthly fees - only pay for leads you receive.',
    url: `${SITE_URL}/for-contractors`,
    siteName: SITE_NAME,
    type: 'website',
  },
};

const BENEFITS = [
  {
    icon: '💰',
    title: 'Pay Per Lead',
    description: 'No monthly fees or contracts. Only pay $15-75 when you receive a qualified lead.',
  },
  {
    icon: '🎯',
    title: 'Targeted Leads',
    description: 'Get leads matched to your services and service areas. No wasted time on bad fits.',
  },
  {
    icon: '⚡',
    title: 'Instant Delivery',
    description: 'Leads sent directly to your email and dashboard. Contact homeowners within minutes.',
  },
  {
    icon: '🛡️',
    title: 'Quality Guarantee',
    description: 'Dispute bad leads and get automatic refunds. We only charge for real opportunities.',
  },
  {
    icon: '📊',
    title: 'Track Everything',
    description: 'Dashboard to manage leads, track conversions, and see your ROI in real-time.',
  },
  {
    icon: '🏆',
    title: 'Build Your Reputation',
    description: 'Get a public profile page that ranks in Google. More visibility = more business.',
  },
];

const TESTIMONIALS = [
  {
    quote: "I've gotten 12 jobs from leads this month alone. Best investment I've made for my business.",
    name: 'Mike R.',
    company: 'MR Plumbing',
    city: 'Chicago',
  },
  {
    quote: 'The leads are actually qualified - homeowners who are ready to hire. Not tire kickers.',
    name: 'Sarah T.',
    company: 'Apex Electrical',
    city: 'New York',
  },
  {
    quote: 'Finally a lead service that makes sense. Pay for what you get, no monthly subscription BS.',
    name: 'James L.',
    company: 'JL Renovations',
    city: 'Washington DC',
  },
];

export default function ForContractorsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-32">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Now accepting contractors in 6 cities
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Get Qualified Leads from
              <br />
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Homeowners Near You
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Homeowners are searching for contractors on our platform right now. 
              Join for free and only pay when you receive a qualified lead.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/contractors/signup">
                <Button size="lg" className="h-14 px-8 text-lg">
                  Join Free — Start Getting Leads
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                No credit card required to sign up
              </p>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                No monthly fees
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                Cancel anytime
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                Quality guarantee
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">How It Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Start receiving leads in under 5 minutes
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                1
              </div>
              <h3 className="mt-4 text-xl font-semibold">Create Your Profile</h3>
              <p className="mt-2 text-muted-foreground">
                Tell us about your business, services, and the areas you serve. Takes 2 minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                2
              </div>
              <h3 className="mt-4 text-xl font-semibold">Add Payment Method</h3>
              <p className="mt-2 text-muted-foreground">
                Securely add a card. You won&apos;t be charged until you receive your first lead.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                3
              </div>
              <h3 className="mt-4 text-xl font-semibold">Get Leads Instantly</h3>
              <p className="mt-2 text-muted-foreground">
                Receive leads via email with full contact details. Reach out and close the deal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Why Contractors Choose Us</h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <Card key={benefit.title} className="border-border">
                <CardContent className="p-6">
                  <div className="text-3xl">{benefit.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Simple, Transparent Pricing</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            No subscriptions, no hidden fees. Pay only for leads you receive.
          </p>

          <div className="mx-auto mt-12 max-w-md">
            <Card className="border-2 border-primary">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold">Pay Per Lead</h3>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">$15-75</span>
                    <span className="text-muted-foreground"> / lead</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Price varies by project type
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-green-500" />
                    <span>Signage & general: $15-25</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-green-500" />
                    <span>Renovation & trades: $25-40</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-green-500" />
                    <span>New construction: $50-75</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-green-500" />
                    <span>Max 3 contractors per lead</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckIcon className="h-5 w-5 text-green-500" />
                    <span>Dispute protection included</span>
                  </div>
                </div>

                <Link href="/contractors/signup" className="mt-8 block">
                  <Button className="w-full" size="lg">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">What Contractors Say</h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <Card key={testimonial.name} className="border-border">
                <CardContent className="p-6">
                  <p className="text-muted-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="mt-4">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.company} · {testimonial.city}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Available in These Cities</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            We&apos;re actively connecting contractors with homeowners in these markets
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/for-contractors/${city.slug}`}
                className="group rounded-lg border border-border p-4 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <h3 className="font-semibold group-hover:text-primary">{city.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Get leads from homeowners in {city.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to Grow Your Business?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Join hundreds of contractors already getting leads through our platform.
            Sign up takes 2 minutes and you can start receiving leads today.
          </p>

          <div className="mt-8">
            <Link href="/contractors/signup">
              <Button size="lg" className="h-14 px-8 text-lg">
                Join Free — No Credit Card Required
              </Button>
            </Link>
          </div>
        </div>
      </section>
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
