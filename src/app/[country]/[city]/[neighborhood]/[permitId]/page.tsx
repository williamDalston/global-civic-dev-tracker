import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { JsonLd, buildBreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PermitCard } from '@/components/permits/permit-card';
import { CTABanner } from '@/components/lead-generation/cta-banner';
import { AdSlot } from '@/components/ads/ad-slot';
import { DynamicPermitMap } from '@/components/maps/dynamic-map';
import { COUNTRIES } from '@/lib/config/countries';
import { CITIES } from '@/lib/config/cities';
import { SITE_URL, PERMIT_CATEGORIES, PERMIT_STATUSES } from '@/lib/config/constants';
import { safeQuery } from '@/lib/db/safe-query';
import { getCityBySlug } from '@/lib/db/queries/cities';
import { getNeighborhoodBySlug } from '@/lib/db/queries/neighborhoods';
import { getPermitBySlug, getRelatedPermits } from '@/lib/db/queries/permits';
import { buildPermitMeta } from '@/lib/seo/meta';
import { buildPermitSchema } from '@/lib/seo/structured-data';
import { formatDate, formatCurrency } from '@/lib/utils/format';

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const revalidate = 86400;

interface Props {
  params: Promise<{ country: string; city: string; neighborhood: string; permitId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const {
    country: countrySlug,
    city: citySlug,
    neighborhood: neighborhoodSlug,
    permitId,
  } = await params;
  const city = CITIES.find((c) => c.slug === citySlug && c.countrySlug === countrySlug);
  if (!city) return {};

  // Resolve city ID from DB for permit lookup
  const dbCity = await safeQuery(() => getCityBySlug(citySlug));
  const cityId = dbCity?.id ?? null;

  const dbNeighborhood = cityId
    ? await safeQuery(() => getNeighborhoodBySlug(cityId, neighborhoodSlug))
    : null;
  const neighborhoodName = dbNeighborhood?.name ?? slugToName(neighborhoodSlug);

  const permit = cityId ? await safeQuery(() => getPermitBySlug(cityId, permitId)) : null;
  if (permit) {
    const meta = buildPermitMeta({
      permitId: permit.globalPermitId,
      address: permit.propertyAddress,
      category: permit.permitCategory,
      cityName: city.name,
      neighborhoodName,
      countrySlug,
      citySlug,
      neighborhoodSlug,
      permitSlug: permit.slug,
      workDescription: permit.workDescription,
    });
    if (permit.noindex) {
      meta.robots = { index: false, follow: true };
    }
    return meta;
  }

  return {
    title: `Permit ${permitId} in ${neighborhoodName}, ${city.name}`,
    description: `View details of building permit ${permitId} in ${neighborhoodName}, ${city.name}.`,
  };
}

export default async function PermitDetailPage({ params }: Props) {
  const {
    country: countrySlug,
    city: citySlug,
    neighborhood: neighborhoodSlug,
    permitId,
  } = await params;
  const country = COUNTRIES.find((c) => c.slug === countrySlug);
  const city = CITIES.find((c) => c.slug === citySlug && c.countrySlug === countrySlug);

  if (!country || !city) notFound();

  // Resolve city ID from DB
  const dbCity = await safeQuery(() => getCityBySlug(citySlug));
  const cityId = dbCity?.id ?? null;

  const permit = cityId ? await safeQuery(() => getPermitBySlug(cityId, permitId)) : null;

  // Use DB neighborhood name if we can resolve it, otherwise reconstruct from slug
  const dbNeighborhood = cityId
    ? await safeQuery(() => getNeighborhoodBySlug(cityId, neighborhoodSlug))
    : null;
  const neighborhoodName = dbNeighborhood?.name ?? slugToName(neighborhoodSlug);

  const relatedPermits = permit?.neighborhoodId
    ? await safeQuery(() =>
        getRelatedPermits(permit.id, permit.neighborhoodId!, permit.permitCategory, 4)
      )
    : null;

  const breadcrumbItems = [
    { label: country.name, href: `/${country.slug}` },
    { label: city.name, href: `/${country.slug}/${city.slug}` },
    {
      label: neighborhoodName,
      href: `/${country.slug}/${city.slug}/${neighborhoodSlug}`,
    },
    {
      label: permit ? `Permit ${permit.globalPermitId}` : `Permit ${permitId}`,
      href: `/${country.slug}/${city.slug}/${neighborhoodSlug}/${permitId}`,
    },
  ];

  const statusVariant =
    permit?.status === 'approved' || permit?.status === 'completed'
      ? ('success' as const)
      : permit?.status === 'revoked' || permit?.status === 'expired'
        ? ('destructive' as const)
        : ('secondary' as const);

  const cost = permit?.estimatedCost ? parseFloat(permit.estimatedCost) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6 lg:px-8 lg:pb-8">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: country.name, url: `${SITE_URL}/${country.slug}` },
          { name: city.name, url: `${SITE_URL}/${country.slug}/${city.slug}` },
          {
            name: neighborhoodName,
            url: `${SITE_URL}/${country.slug}/${city.slug}/${neighborhoodSlug}`,
          },
          {
            name: permit ? `Permit ${permit.globalPermitId}` : `Permit ${permitId}`,
            url: `${SITE_URL}/${country.slug}/${city.slug}/${neighborhoodSlug}/${permitId}`,
          },
        ])}
      />
      {permit && (
        <JsonLd
          data={buildPermitSchema({
            permitId: permit.globalPermitId,
            address: permit.propertyAddress,
            category: permit.permitCategory,
            status: permit.status,
            issueDate: permit.issueDate,
            estimatedCost: cost,
            description: permit.workDescription,
            url: `${SITE_URL}/${country.slug}/${city.slug}/${neighborhoodSlug}/${permitId}`,
            cityName: city.name,
            neighborhoodName,
            latitude: permit.latitude,
            longitude: permit.longitude,
          })}
        />
      )}

      <Breadcrumbs items={breadcrumbItems} />

      <div className="mb-4">
        <Link
          href={`/${countrySlug}/${citySlug}/${neighborhoodSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          &larr; All permits in {neighborhoodName}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="animate-fade-in-up">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant} className="text-xs">
                    {permit ? PERMIT_STATUSES[permit.status] || permit.status : 'Pending Data'}
                  </Badge>
                  {permit && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {PERMIT_CATEGORIES[permit.permitCategory] || permit.permitCategory}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {permit?.propertyAddress ?? `${neighborhoodName}, ${city.name}`}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {permit
                    ? `${PERMIT_CATEGORIES[permit.permitCategory] || permit.permitCategory} permit in ${neighborhoodName}, ${city.name}`
                    : `Permit details in ${neighborhoodName}, ${city.name}`}
                </p>
              </div>
              {cost !== null && !isNaN(cost) && (
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Est. Cost
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
                    {formatCurrency(cost)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Key facts strip */}
          {permit && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: 'Permit ID',
                  value: permit.globalPermitId,
                },
                {
                  label: 'Issue Date',
                  value: permit.issueDate ? formatDate(permit.issueDate) : '--',
                },
                {
                  label: 'Status',
                  value: PERMIT_STATUSES[permit.status] || permit.status,
                },
                {
                  label: 'Type',
                  value: permit.permitType || '--',
                },
              ].map((fact) => (
                <Card key={fact.label} className="bg-card/50">
                  <CardContent className="px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {fact.label}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                      {fact.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Permit location map */}
          {permit?.latitude != null && permit?.longitude != null ? (
            <div className="mt-6 overflow-hidden rounded-xl border border-border">
              <DynamicPermitMap
                permits={[
                  {
                    id: permit.id,
                    latitude: Number(permit.latitude),
                    longitude: Number(permit.longitude),
                    propertyAddress: permit.propertyAddress,
                    permitCategory: permit.permitCategory,
                    status: permit.status,
                    slug: permit.slug,
                    estimatedCost: permit.estimatedCost,
                  },
                ]}
                center={[Number(permit.latitude), Number(permit.longitude)]}
                zoom={16}
                height="280px"
              />
            </div>
          ) : (
            <div className="mt-6 flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-card/50">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">Location data not available</p>
              </div>
            </div>
          )}

          {/* AI Narrative */}
          <section className="mt-10">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
              <h2 className="text-xl font-bold text-foreground">Development Analysis</h2>
            </div>
            <div className="mt-4 rounded-xl border border-border bg-card p-6">
              {permit?.aiNarrative ? (
                <div className="space-y-4">
                  {permit.aiNarrative.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="leading-relaxed text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <svg className="mx-auto h-8 w-8 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                  <p className="mt-2 text-sm text-muted-foreground">
                    AI analysis for this permit is being generated. Check back soon!
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Permit Details */}
          <section className="mt-10">
            <h2 className="text-xl font-bold text-foreground">Permit Information</h2>
            <div className="mt-4 rounded-xl border border-border bg-card">
              {permit ? (
                <dl className="divide-y divide-border">
                  {[
                    { label: 'Permit ID', value: permit.globalPermitId },
                    {
                      label: 'Category',
                      value:
                        PERMIT_CATEGORIES[permit.permitCategory] || permit.permitCategory,
                    },
                    { label: 'Type', value: permit.permitType },
                    {
                      label: 'Status',
                      value: PERMIT_STATUSES[permit.status] || permit.status,
                    },
                    {
                      label: 'Issue Date',
                      value: permit.issueDate ? formatDate(permit.issueDate) : null,
                    },
                    {
                      label: 'Application Date',
                      value: permit.applicationDate
                        ? formatDate(permit.applicationDate)
                        : null,
                    },
                    {
                      label: 'Estimated Cost',
                      value: cost !== null && !isNaN(cost)
                        ? formatCurrency(cost)
                        : null,
                    },
                    { label: 'Address', value: permit.propertyAddress },
                    { label: 'Work Description', value: permit.workDescription },
                  ]
                    .filter((item) => item.value)
                    .map((item) => (
                      <div key={item.label} className="flex justify-between gap-4 px-6 py-3.5">
                        <dt className="shrink-0 text-sm font-medium text-muted-foreground">
                          {item.label}
                        </dt>
                        <dd className="max-w-md text-right text-sm text-foreground">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                </dl>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Detailed permit information is being imported. Check back soon!
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <CTABanner id="lead-form" permitCategory={permit?.permitCategory} cityName={city.name} citySlug={city.slug} permitId={permit?.id} />

          <AdSlot slot="sidebar-permit" format="vertical" className="hidden lg:block" />

          {/* Related Permits */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">Related Permits</h3>
              {relatedPermits && relatedPermits.length > 0 && (
                <Badge variant="secondary" className="text-xs">{relatedPermits.length}</Badge>
              )}
            </div>
            {relatedPermits && relatedPermits.length > 0 ? (
              <div className="mt-4 space-y-3">
                {relatedPermits.map((related) => (
                  <PermitCard
                    key={related.id}
                    permit={{
                      slug: related.slug,
                      propertyAddress: related.propertyAddress,
                      permitCategory: related.permitCategory,
                      permitType: related.permitType,
                      status: related.status,
                      issueDate: related.issueDate,
                      estimatedCost: related.estimatedCost,
                      workDescription: related.workDescription,
                    }}
                    href={`/${country.slug}/${city.slug}/${neighborhoodSlug}/${related.slug}`}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No similar permits found in this area yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-sm lg:hidden">
        <a
          href="#lead-form"
          className="flex h-12 w-full items-center justify-center rounded-lg bg-cta text-sm font-bold text-cta-foreground shadow-lg shadow-cta/20 transition-colors hover:bg-cta/90"
        >
          Get Free Quotes for This Project
        </a>
      </div>
    </div>
  );
}
