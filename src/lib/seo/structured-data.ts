import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/config/constants';
import { PERMIT_CATEGORIES, PERMIT_STATUSES } from '@/lib/config/constants';

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildPlaceSchema(options: {
  name: string;
  description: string;
  url: string;
  latitude?: number | null;
  longitude?: number | null;
  containedIn?: string;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: options.name,
    description: options.description,
    url: options.url,
  };

  if (options.latitude != null && options.longitude != null) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: options.latitude,
      longitude: options.longitude,
    };
  }

  if (options.containedIn) {
    schema.containedInPlace = {
      '@type': 'Place',
      name: options.containedIn,
    };
  }

  return schema;
}

export function buildPermitSchema(options: {
  permitId: string;
  address: string;
  category: string;
  status: string;
  issueDate: string | null;
  estimatedCost: number | null;
  description: string | null;
  url: string;
  cityName: string;
  neighborhoodName?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentPermit',
    name: `Building Permit ${options.permitId}`,
    permitAudience: {
      '@type': 'Audience',
      audienceType: 'Property Owner',
    },
    issuedBy: {
      '@type': 'GovernmentOrganization',
      name: `${options.cityName} Building Department`,
    },
    url: options.url,
    description:
      options.description ||
      `${PERMIT_CATEGORIES[options.category] || options.category} permit at ${options.address}`,
  };

  if (options.issueDate) {
    schema.validFrom = options.issueDate;
  }

  if (options.status) {
    schema.additionalType = PERMIT_STATUSES[options.status] || options.status;
  }

  schema.spatialCoverage = {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      streetAddress: options.address,
      addressLocality: options.cityName,
    },
  };

  if (options.latitude != null && options.longitude != null) {
    (schema.spatialCoverage as Record<string, unknown>).geo = {
      '@type': 'GeoCoordinates',
      latitude: options.latitude,
      longitude: options.longitude,
    };
  }

  return schema;
}

export function buildCityHubSchema(options: {
  cityName: string;
  countryName: string;
  url: string;
  description: string;
  latitude: number;
  longitude: number;
  permitCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Building Permits in ${options.cityName}, ${options.countryName}`,
    description: options.description,
    url: options.url,
    about: {
      '@type': 'Place',
      name: options.cityName,
      containedInPlace: {
        '@type': 'Country',
        name: options.countryName,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: options.latitude,
        longitude: options.longitude,
      },
    },
    ...(options.permitCount != null && {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: options.permitCount,
      },
    }),
  };
}
