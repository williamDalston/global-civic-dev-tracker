export interface Permit {
  id: number;
  globalPermitId: string;
  cityId: number;
  neighborhoodId: number | null;
  issueDate: string | null;
  applicationDate: string | null;
  propertyAddress: string;
  workDescription: string | null;
  permitCategory: string;
  permitType: string | null;
  status: string;
  estimatedCost: number | null;
  latitude: number | null;
  longitude: number | null;
  slug: string;
  aiNarrative: string | null;
  aiGeneratedAt: string | null;
  narrativeVersion: number;
  rawData: Record<string, unknown>;
  sourceUrl: string | null;
  indexedAt: string | null;
  lastImpression: string | null;
  noindex: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermitSummary {
  id: number;
  globalPermitId: string;
  propertyAddress: string;
  permitCategory: string;
  permitType: string | null;
  status: string;
  issueDate: string | null;
  estimatedCost: number | null;
  slug: string;
  workDescription: string | null;
}

export interface PermitWithRelations extends Permit {
  city: CityInfo;
  neighborhood: NeighborhoodInfo | null;
}

export interface CityInfo {
  name: string;
  slug: string;
  countrySlug: string;
  countryName: string;
}

export interface NeighborhoodInfo {
  name: string;
  slug: string;
}

export type PermitCategory =
  | 'new-construction'
  | 'renovation'
  | 'demolition'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'roofing'
  | 'mechanical'
  | 'fire-safety'
  | 'signage'
  | 'elevator'
  | 'boiler'
  | 'general'
  | 'other';

export type PermitStatus = 'approved' | 'pending' | 'completed' | 'revoked' | 'expired';
