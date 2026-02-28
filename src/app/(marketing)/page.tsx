import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/components/seo/json-ld';
import { CITIES } from '@/lib/config/cities';
import { COUNTRIES } from '@/lib/config/countries';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/config/constants';
import { buildWebsiteSchema } from '@/lib/seo/structured-data';
import { buildHomeMeta } from '@/lib/seo/meta';
import { safeQuery } from '@/lib/db/safe-query';
import { getTotalPermitCount } from '@/lib/db/queries/permits';

export const revalidate = 3600;

export const metadata = buildHomeMeta();

const CITY_FLAGS: Record<string, string> = {
  'washington-dc': '\uD83C\uDDFA\uD83C\uDDF8',
  'new-york-city': '\uD83C\uDDFA\uD83C\uDDF8',
  chicago: '\uD83C\uDDFA\uD83C\uDDF8',
  london: '\uD83C\uDDEC\uD83C\uDDE7',
  sydney: '\uD83C\uDDE6\uD83C\uDDFA',
  toronto: '\uD83C\uDDE8\uD83C\uDDE6',
};

export default async function HomePage() {
  const totalPermits = await safeQuery(() => getTotalPermitCount());

  return (
    <>
      <JsonLd data={buildWebsiteSchema()} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Animated background grid */}
        <div className="absolute inset-0 grid-pattern opacity-0 dark:opacity-100" />
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-36">
          <div className="animate-fade-in-up">
            <Badge variant="secondary" className="mb-6 gap-2 px-4 py-1.5">
              <span className="glow-dot" />
              {totalPermits
                ? `Tracking ${totalPermits.toLocaleString()}+ permits`
                : 'Tracking 6 cities'}
              {' worldwide'}
            </Badge>
          </div>

          <h1 className="animate-fade-in-up delay-1 max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
            Track Building Permits &amp;{' '}
            <br className="hidden sm:block" />
            Development{' '}
            <span className="gradient-text">Worldwide</span>
          </h1>

          <p className="animate-fade-in-up delay-2 mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {SITE_DESCRIPTION} Real-time data from government open data portals,
            enriched with AI analysis and neighborhood intelligence.
          </p>

          <div className="animate-fade-in-up delay-3 mt-10 flex flex-wrap gap-3">
            {COUNTRIES.map((country) => (
              <Link
                key={country.slug}
                href={`/${country.slug}`}
                className="group rounded-lg border border-border bg-background/80 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5"
              >
                {country.name}
                <span className="ml-2 inline-block text-muted-foreground transition-transform duration-200 group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
          {[
            { label: 'Cities Tracked', value: '6', accent: true },
            { label: 'Countries', value: '4', accent: false },
            { label: 'Data Sources', value: '6 APIs', accent: false },
            { label: 'Updated', value: 'Every 6h', accent: true },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`animate-fade-in-up delay-${i} border-r border-border px-6 py-8 last:border-r-0`}
            >
              <p className={`stat-value text-3xl font-bold tracking-tight ${stat.accent ? 'text-primary' : 'text-foreground'}`}>
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* City Grid */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="animate-fade-in-up flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Explore
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Cities We Track
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Real-time building permit data and development activity across
              major metropolitan areas.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((city, i) => {
            const country = COUNTRIES.find((c) => c.slug === city.countrySlug);
            return (
              <Link
                key={city.slug}
                href={`/${city.countrySlug}/${city.slug}`}
                className={`group animate-fade-in-up delay-${i}`}
              >
                <Card className="card-hover-lift h-full transition-all hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5 text-lg">
                        <span className="text-xl" role="img" aria-label={country?.name ?? ''}>
                          {CITY_FLAGS[city.slug] || ''}
                        </span>
                        {city.name}
                      </span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {country?.code}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      View building permits, zoning changes, and development
                      activity in {city.name}.
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                        {city.apiSource}
                      </span>
                      <span className="font-medium text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">
                        Explore &rarr;
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative border-t border-border">
        <div className="absolute inset-0 section-gradient-top" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              How It Works
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              From Raw Data to Neighborhood Intelligence
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              We turn government open data into actionable insights for homeowners,
              developers, and contractors.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Data Aggregation',
                description:
                  'We continuously ingest building permit data from government open data portals across 6 major cities worldwide — DC, NYC, Chicago, London, Sydney, and Toronto.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Neighborhood Intelligence',
                description:
                  'Every permit is mapped to its neighborhood, enriched with AI-generated analysis, and tracked for development trends over time.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Connect with Contractors',
                description:
                  'Planning a renovation or new build? Get matched with verified local contractors who specialize in your type of project and neighborhood.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`animate-fade-in-up delay-${i} group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5`}
              >
                {/* Step connector line (hidden on mobile) */}
                {i < 2 && (
                  <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-border md:block" />
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  {item.icon}
                </div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-primary/50">
                  Step {item.step}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 px-8 py-16 text-center">
            {/* Background decoration */}
            <div className="absolute inset-0 dot-pattern opacity-30" />
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

            <div className="relative">
              <h2 className="text-3xl font-bold text-foreground">
                Planning a Construction or Renovation Project?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                See what your neighbors are building, then get matched with verified
                local contractors. Free quotes, no obligation.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {CITIES.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/${city.countrySlug}/${city.slug}`}
                    className="rounded-lg bg-cta px-6 py-2.5 text-sm font-semibold text-cta-foreground shadow-md shadow-cta/20 transition-all hover:bg-cta/90 hover:shadow-lg hover:shadow-cta/30"
                  >
                    Find Contractors in {city.name}
                  </Link>
                ))}
                <Link
                  href={`/${COUNTRIES[0].slug}`}
                  className="rounded-lg border border-border bg-background/80 px-6 py-2.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-accent"
                >
                  View All Cities
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
