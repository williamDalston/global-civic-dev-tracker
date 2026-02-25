import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { JsonLd, buildBreadcrumbJsonLd } from '@/components/seo/json-ld';
import { COUNTRIES } from '@/lib/config/countries';
import { getCitiesByCountry } from '@/lib/config/cities';
import { SITE_URL } from '@/lib/config/constants';

export const revalidate = 3600;

interface Props {
  params: Promise<{ country: string }>;
}

export async function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: countrySlug } = await params;
  const country = COUNTRIES.find((c) => c.slug === countrySlug);
  if (!country) return {};

  return {
    title: `Building Permits in ${country.name}`,
    description: `Track building permits, zoning changes, and development activity across ${country.name}.`,
  };
}

export default async function CountryPage({ params }: Props) {
  const { country: countrySlug } = await params;
  const country = COUNTRIES.find((c) => c.slug === countrySlug);
  if (!country) notFound();

  const cities = getCitiesByCountry(countrySlug);

  const breadcrumbItems = [{ label: country.name, href: `/${country.slug}` }];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', url: SITE_URL },
          { name: country.name, url: `${SITE_URL}/${country.slug}` },
        ])}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Building Permits in {country.name}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Explore development activity across {cities.length} major{' '}
        {cities.length === 1 ? 'city' : 'cities'} in {country.name}.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Link key={city.slug} href={`/${countrySlug}/${city.slug}`} className="group">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <CardTitle>{city.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View building permits and development activity in {city.name}.
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
