export interface RawPermitBatch {
  records: unknown[];
  hasMore: boolean;
  nextOffset?: number;
  totalRecords?: number;
}

export interface FetchOptions {
  since?: Date;
  offset?: number;
  limit?: number;
}

export interface UniversalPermit {
  globalPermitId: string;
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
  rawData: Record<string, unknown>;
  sourceUrl: string | null;
}

export interface CityAdapterConfig {
  citySlug: string;
  cityId: number;
  apiBaseUrl: string;
  apiToken?: string;
  datasetId?: string;
}

export interface ETLSyncState {
  id: number;
  cityId: number;
  lastSyncAt: string | null;
  lastOffset: number;
  lastRecordId: string | null;
  recordsSynced: number;
  status: 'idle' | 'running' | 'failed';
  errorMessage: string | null;
  updatedAt: string;
}

export interface ETLResult {
  citySlug: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  errors: string[];
  duration: number;
}
