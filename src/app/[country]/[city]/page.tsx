import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { JsonLd, buildBreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PermitCard } from '@/components/permits/permit-card';
import { DynamicNeighborhoodMap } from '@/components/maps/dynamic-map';
import { DynamicCategoryChart, DynamicTrendChart } from '@/components/charts/dynamic-charts';
import { CTABanner } from '@/components/lead-generation/cta-banner';
import { AdSlot } from '@/components/ads/ad-slot';
import { COUNTRIES } from '@/lib/config/countries';
import { CITIES } from '@/lib/config/cities';
import { SITE_URL, PERMIT_CATEGORIES } from '@/lib/config/constants';
import { safeQuery } from '@/lib/db/safe-query';
import { getCityBySlug } from '@/lib/db/queries/cities';
import { getNeighborhoodsWithCounts } from '@/lib/db/queries/neighborhoods';
import {
  getRecentPermits,
  getPermitCountByCity,
  getCategoryStats,
  getMonthlyTrend,
} from '@/lib/db/queries/permits';
import { getCitySyncState } from '@/lib/db/queries/admin';
import { formatRelativeTime } from '@/lib/utils/format';
import { buildCityMeta } from '@/lib/seo/meta';
import { buildCityHubSchema } from '@/lib/seo/structured-data';

export const revalidate = 1800;

interface Props {
  params: Promise<{ country: string; city: string }>;
}

export async function generateStaticParams() {
  return CITIES.map((c) => ({
    country: c.countrySlug,
    city: c.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: countrySlug, city: citySlug } = await params;
  const city = CITIES.find((c) => c.slug === citySlug && c.countrySlug === countrySlug);
  const country = COUNTRIES.find((c) => c.slug === countrySlug);
  if (!city || !country) return {};

  return buildCityMeta(city.name, country.name, countrySlug, citySlug);
}

export default async function CityPage({ params }: Props) {
  const { country: countrySlug, city: citySlug } = await params;
  const country = COUNTRIES.find((c) => c.slug === countrySlug);
  const city = CITIES.find((c) => c.slug === citySlug && c.countrySlug === countrySlug);

  if (!country || !city) notFound();

  // Resolve city ID from DB
  const dbCity = await safeQuery(() => getCityBySlug(citySlug));
  const cityId = dbCity?.id ?? null;

  // DB queries — only if we resolved the cityId
  const [neighborhoods, recentPermits, totalPermits, categoryStats, monthlyTrend, syncState] = cityId
    ? await Promise.all([
        safeQuery(() => getNeighborhoodsWithCounts(cityId)),
        safeQuery(() => getRecentPermits(cityId, 6)),
        safeQuery(() => getPermitCountByCity(cityId)),
        safeQuery(() => getCategoryStats(cityId)),
        safeQuery(() => getMonthlyTrend(cityId, 12)),
        safeQuery(() => getCitySyncState(cityId)),
      ])
    : [null, null, null, null, null, null];

  const breadcrumbItems = [
    { label: country.name, href: `/${country.slug}` },
    { label: city.name, href: `/${country.slug}/${city.slug}` },
  ];

  const stats: Array<{ label: string; value: string; icon: React.ReactNode; extra?: React.ReactNode }> = [
    {
      label: 'Total Permits',
      value: totalPermits?.toLocaleString() ?? '--',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
    {
      label: 'Neighborhoods',
      value: neighborhoods?.length.toString() ?? '--',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      ),
    },
    {
      label: 'Top Category',
      value: categoryStats?.[0]
        ? PERMIT_CATEGORIES[categoryStats[0].category] || categoryStats[0].category
        : '--',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
    },
    {
      label: 'Data Source',
      value: city.apiSource,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      ),
      extra: syncState?.lastSyncAt ? (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Updated {formatRelativeTime(syncState.lastSyncAt)}
        </div>
      ) : null,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: country.name, url: `${SITE_URL}/${country.slug}` },
          { name: city.name, url: `${SITE_URL}/${country.slug}/${city.slug}` },
        ])}
      />
      <JsonLd
        data={buildCityHubSchema({
          cityName: city.name,
          countryName: country.name,
          url: `${SITE_URL}/${country.slug}/${city.slug}`,
          description: `Track building permits and development activity in ${city.name}.`,
          latitude: city.centerLat,
          longitude: city.centerLng,
          permitCount: totalPermits ?? undefined,
        })}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Building Permits in{' '}
          <span className="gradient-text">{city.name}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Track development activity across neighborhoods in {city.name},{' '}
          {country.name}.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={stat.label} className={`animate-fade-in-up delay-${i} card-hover-lift`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="stat-value mt-0.5 truncate text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  {stat.extra}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Neighborhood Map */}
      {neighborhoods && neighborhoods.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <h2 className="shrink-0 text-sm font-semibold uppercase tracking-widest text-primary">
              Neighborhood Map
            </h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="mt-3 text-center text-muted-foreground">
            Explore neighborhoods by permit activity volume.
          </p>
          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <DynamicNeighborhoodMap
              neighborhoods={neighborhoods.map((h) => ({
                name: h.name,
                slug: h.slug,
                centerLat: h.centerLat != null ? Number(h.centerLat) : null,
                centerLng: h.centerLng != null ? Number(h.centerLng) : null,
                permitCount: h.permitCount,
              }))}
              center={[city.centerLat, city.centerLng]}
              baseUrl={`/${country.slug}/${city.slug}`}
            />
          </div>
        </section>
      )}

      {/* Charts */}
      {((categoryStats && categoryStats.length > 0) ||
        (monthlyTrend && monthlyTrend.length > 0)) && (
        <section className="mt-16">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <h2 className="shrink-0 text-sm font-semibold uppercase tracking-widest text-primary">
              Development Insights
            </h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {categoryStats && categoryStats.length > 0 && (
              <DynamicCategoryChart data={categoryStats} />
            )}
            {monthlyTrend && monthlyTrend.length > 0 && (
              <DynamicTrendChart data={monthlyTrend} />
            )}
          </div>
        </section>
      )}

      {/* Neighborhoods */}
      <section className="mt-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Browse
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Neighborhoods
            </h2>
            <p className="mt-2 text-muted-foreground">
              Explore permits by neighborhood in {city.name}.
            </p>
          </div>
          {neighborhoods && neighborhoods.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {neighborhoods.length} {neighborhoods.length === 1 ? 'area' : 'areas'}
            </p>
          )}
        </div>
        {neighborhoods && neighborhoods.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {neighborhoods.map((hood) => (
              <Link
                key={hood.slug}
                href={`/${country.slug}/${city.slug}/${hood.slug}`}
                className="card-hover-lift group rounded-xl border border-border bg-card p-6 hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                    {hood.name}
                  </h3>
                  <span className="text-sm font-medium text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">
                    &rarr;
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {hood.permitCount} {hood.permitCount === 1 ? 'permit' : 'permits'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">
              No neighborhoods loaded yet. Building permit data for {city.name} is being imported — check back soon!
            </p>
          </div>
        )}
      </section>

      {/* Recent Permits */}
      <section className="mt-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Latest
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Recent Permits
            </h2>
          </div>
        </div>
        {recentPermits && recentPermits.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentPermits.map((permit) => (
              <PermitCard
                key={permit.id}
                permit={{
                  id: permit.id,
                  globalPermitId: permit.globalPermitId,
                  propertyAddress: permit.propertyAddress,
                  permitCategory: permit.permitCategory,
                  permitType: permit.permitType,
                  status: permit.status,
                  issueDate: permit.issueDate,
                  estimatedCost: permit.estimatedCost ? parseFloat(permit.estimatedCost) : null,
                  slug: permit.slug,
                  workDescription: permit.workDescription,
                }}
                href={permit.neighborhoodSlug
                  ? `/${country.slug}/${city.slug}/${permit.neighborhoodSlug}/${permit.slug}`
                  : `/${country.slug}/${city.slug}`
                }
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">
              No recent permits yet. Building permit data for {city.name} is being imported — check back soon!
            </p>
          </div>
        )}
      </section>

      {/* Display Ad */}
      <AdSlot slot="city-leaderboard" format="horizontal" className="mx-auto mt-12 max-w-3xl" />

      {/* Lead Capture CTA */}
      <section className="mt-16 mx-auto max-w-xl">
        <CTABanner
          cityName={city.name}
          citySlug={city.slug}
        />
      </section>
    </div>
  );
}
