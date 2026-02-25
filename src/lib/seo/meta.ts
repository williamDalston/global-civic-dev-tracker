import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/config/constants';
import { PERMIT_CATEGORIES } from '@/lib/config/constants';

export function buildHomeMeta(): Metadata {
  return {
    title: `${SITE_NAME} — Track Building Permits Worldwide`,
    description: SITE_DESCRIPTION,
    openGraph: {
      title: `${SITE_NAME} — Track Building Permits Worldwide`,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
    alternates: {
      canonical: SITE_URL,
    },
  };
}

export function buildCountryMeta(countryName: string, countrySlug: string): Metadata {
  const title = `Building Permits in ${countryName}`;
  const description = `Track building permits, construction activity, and urban development across cities in ${countryName}.`;
  const url = `${SITE_URL}/${countrySlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
    },
    alternates: { canonical: url },
  };
}

export function buildCityMeta(
  cityName: string,
  countryName: string,
  countrySlug: string,
  citySlug: string,
  permitCount?: number
): Metadata {
  const title = `Building Permits in ${cityName}, ${countryName}`;
  const countStr = permitCount ? `${permitCount.toLocaleString()} ` : '';
  const description = `Browse ${countStr}building permits in ${cityName}. Track new construction, renovations, and development activity by neighborhood.`;
  const url = `${SITE_URL}/${countrySlug}/${citySlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
    },
    alternates: { canonical: url },
  };
}

export function buildNeighborhoodMeta(
  neighborhoodName: string,
  cityName: string,
  countrySlug: string,
  citySlug: string,
  neighborhoodSlug: string,
  permitCount?: number
): Metadata {
  const title = `Building Permits in ${neighborhoodName}, ${cityName}`;
  const countStr = permitCount ? `${permitCount.toLocaleString()} ` : '';
  const description = `Explore ${countStr}building permits in ${neighborhoodName}, ${cityName}. Track construction, renovations, and development trends in this neighborhood.`;
  const url = `${SITE_URL}/${countrySlug}/${citySlug}/${neighborhoodSlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
    },
    alternates: { canonical: url },
  };
}

export function buildPermitMeta(options: {
  permitId: string;
  address: string;
  category: string;
  cityName: string;
  neighborhoodName: string;
  countrySlug: string;
  citySlug: string;
  neighborhoodSlug: string;
  permitSlug: string;
  workDescription?: string | null;
}): Metadata {
  const categoryLabel = PERMIT_CATEGORIES[options.category] || options.category;
  const title = `${categoryLabel} Permit at ${options.address} — ${options.cityName}`;
  const description = options.workDescription
    ? `${categoryLabel} permit at ${options.address}, ${options.neighborhoodName}. ${options.workDescription.slice(0, 120)}`
    : `View details of ${categoryLabel.toLowerCase()} building permit at ${options.address} in ${options.neighborhoodName}, ${options.cityName}.`;
  const url = `${SITE_URL}/${options.countrySlug}/${options.citySlug}/${options.neighborhoodSlug}/${options.permitSlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'article',
    },
    alternates: { canonical: url },
  };
}
