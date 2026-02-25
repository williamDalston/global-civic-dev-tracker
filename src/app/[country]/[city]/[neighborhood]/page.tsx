import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { JsonLd, buildBreadcrumbJsonLd } from '@/components/seo/json-ld';
import { PermitCard } from '@/components/permits/permit-card';
import { Pagination } from '@/components/ui/pagination';
import { DynamicPermitMap } from '@/components/maps/dynamic-map';
import { COUNTRIES } from '@/lib/config/countries';
import { CITIES } from '@/lib/config/cities';
import { SITE_URL, PERMITS_PER_PAGE } from '@/lib/config/constants';
import { safeQuery } from '@/lib/db/safe-query';
import { getCityBySlug } from '@/lib/db/queries/cities';
import { getNeighborhoodBySlug } from '@/lib/db/queries/neighborhoods';
import { getPermitsByNeighborhood, getPermitsWithCoordinatesByNeighborhood } from '@/lib/db/queries/permits';
import { buildNeighborhoodMeta } from '@/lib/seo/meta';
import { buildPlaceSchema } from '@/lib/seo/structured-data';
import { getPagination } from '@/lib/utils/pagination';

export const revalidate = 900;

interface Props {
  params: Promise<{ country: string; city: string; neighborhood: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: countrySlug, city: citySlug, neighborhood: neighborhoodSlug } = await params;
  const city = CITIES.find((c) => c.slug === citySlug && c.countrySlug === countrySlug);
  if (!city) return {};

  // Try to get the real name from DB, fall back to slug reconstruction
  const dbCity = await safeQuery(() => getCityBySlug(citySlug));
  const dbNeighborhood = dbCity
    ? await safeQuery(() => getNeighborhoodBySlug(dbCity.id, neighborhoodSlug))
    : null;

  const neighborhoodName = dbNeighborhood?.name
    ?? neighborhoodSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  return buildNeighborhoodMeta(neighborhoodName, city.name, countrySlug, citySlug, neighborhoodSlug);
}

export default async function NeighborhoodPage({ params, searchParams }: Props) {
  const { country: countrySlug, city: citySlug, neighborhood: neighborhoodSlug } = await params;
  const { page: pageStr } = await searchParams;
  const country = COUNTRIES.find((c) => c.slug === countrySlug);
  const city = CITIES.find((c) => c.slug === citySlug && c.countrySlug === countrySlug);

  if (!country || !city) notFound();

  const page = Math.max(1, Math.floor(Number(pageStr) || 1));

  // Resolve city ID then neighborhood from DB
  const dbCity = await safeQuery(() => getCityBySlug(citySlug));
  const cityId = dbCity?.id ?? null;

  const neighborhood = cityId
    ? await safeQuery(() => getNeighborhoodBySlug(cityId, neighborhoodSlug))
    : null;

  // Use the DB name if available, otherwise reconstruct from slug
  const neighborhoodName = neighborhood?.name
    ?? neighborhoodSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const permitsResult = neighborhood
    ? await safeQuery(() => getPermitsByNeighborhood(neighborhood.id, page, PERMITS_PER_PAGE))
    : null;

  const permits = permitsResult?.items ?? [];
  const totalPermits = permitsResult?.total ?? 0;
  const pagination = getPagination(page, PERMITS_PER_PAGE, totalPermits);

  const mapPermits = neighborhood
    ? await safeQuery(() => getPermitsWithCoordinatesByNeighborhood(neighborhood.id))
    : null;

  const breadcrumbItems = [
    { label: country.name, href: `/${country.slug}` },
    { label: city.name, href: `/${country.slug}/${city.slug}` },
    {
      label: neighborhoodName,
      href: `/${country.slug}/${city.slug}/${neighborhoodSlug}`,
    },
  ];

  const baseUrl = `/${country.slug}/${city.slug}/${neighborhoodSlug}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: country.name, url: `${SITE_URL}/${country.slug}` },
          { name: city.name, url: `${SITE_URL}/${country.slug}/${city.slug}` },
          {
            name: neighborhoodName,
            url: `${SITE_URL}/${country.slug}/${city.slug}/${neighborhoodSlug}`,
          },
        ])}
      />
      <JsonLd
        data={buildPlaceSchema({
          name: neighborhoodName,
          description: `Building permits and development activity in ${neighborhoodName}, ${city.name}.`,
          url: `${SITE_URL}${baseUrl}`,
          latitude: neighborhood?.centerLat ?? null,
          longitude: neighborhood?.centerLng ?? null,
          containedIn: city.name,
        })}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Building Permits in{' '}
          <span className="gradient-text">{neighborhoodName}</span>
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-lg text-muted-foreground">
            {totalPermits > 0
              ? `${totalPermits.toLocaleString()} permits in ${neighborhoodName}, ${city.name}.`
              : `Development activity in ${neighborhoodName}, ${city.name}.`}
          </p>
          {totalPermits > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalPermits.toLocaleString()} total
            </Badge>
          )}
        </div>
      </div>

      {/* Permit Map */}
      {mapPermits && mapPermits.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-border">
          <DynamicPermitMap
            permits={mapPermits.map((p) => ({
              id: p.id,
              latitude: Number(p.latitude),
              longitude: Number(p.longitude),
              propertyAddress: p.propertyAddress,
              permitCategory: p.permitCategory,
              status: p.status,
              slug: p.slug,
              estimatedCost: p.estimatedCost,
            }))}
            center={[
              neighborhood?.centerLat != null ? Number(neighborhood.centerLat) : city.centerLat,
              neighborhood?.centerLng != null ? Number(neighborhood.centerLng) : city.centerLng,
            ]}
            baseUrl={baseUrl}
          />
        </div>
      ) : (
        <div className="mt-8 flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card/50">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            <p className="mt-2 text-muted-foreground">
              Map will appear once permits with coordinates are loaded.
            </p>
          </div>
        </div>
      )}

      {/* Permit list */}
      <section className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              All Permits
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {totalPermits > 0 ? `${totalPermits.toLocaleString()} Permits` : 'Recent Permits'}
            </h2>
          </div>
          {pagination.totalPages > 1 && (
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          )}
        </div>
        {permits.length > 0 ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {permits.map((permit) => (
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
                  href={`${baseUrl}/${permit.slug}`}
                />
              ))}
            </div>
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                baseUrl={baseUrl}
              />
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">
              Permit data will appear here once the ETL pipeline runs.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
