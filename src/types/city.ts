export interface Country {
  id: number;
  name: string;
  slug: string;
  code: string;
  createdAt: string;
}

export interface City {
  id: number;
  countryId: number;
  name: string;
  slug: string;
  timezone: string;
  centerLat: number;
  centerLng: number;
  apiSource: string;
  apiConfig: Record<string, unknown>;
  etlEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Neighborhood {
  id: number;
  cityId: number;
  name: string;
  slug: string;
  clusterId: string | null;
  centerLat: number | null;
  centerLng: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CityWithCountry extends City {
  country: Country;
}

export interface CityWithNeighborhoods extends City {
  neighborhoods: Neighborhood[];
}

export interface CityStats {
  totalPermits: number;
  permitsThisMonth: number;
  permitsLastMonth: number;
  topCategories: { category: string; count: number }[];
}
