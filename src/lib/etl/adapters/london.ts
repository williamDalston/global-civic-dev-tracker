import { BaseCityAdapter } from './base-adapter';
import { withRetry } from '@/lib/utils/retry';
import type { RawPermitBatch, FetchOptions, UniversalPermit, CityAdapterConfig } from '@/types';

interface LondonPlanningRecord {
  application_number?: string;
  development_address?: string;
  development_description?: string;
  decision_date?: string;
  received_date?: string;
  decision?: string;
  use_class_added?: string;
  borough?: string;
  longitude?: number;
  latitude?: number;
  [key: string]: unknown;
}

const USE_CLASS_MAP: Record<string, string> = {
  A1: 'Retail',
  A2: 'Financial Services',
  A3: 'Restaurant/Cafe',
  A4: 'Pub/Bar',
  A5: 'Takeaway',
  B1: 'Business/Office',
  B2: 'Industrial',
  B8: 'Storage/Distribution',
  C1: 'Hotel',
  C2: 'Residential Institution',
  C3: 'Dwelling',
  D1: 'Non-Residential Institution',
  D2: 'Assembly/Leisure',
  E: 'Commercial',
  F1: 'Learning/Non-Residential',
  F2: 'Local Community',
};

function normalizeLondonCategory(useClass: string | undefined): string {
  const uc = (useClass || '').toUpperCase();
  if (uc.startsWith('C3') || uc.startsWith('C2')) return 'new-construction';
  if (uc.startsWith('A') || uc.startsWith('E')) return 'renovation';
  if (uc.startsWith('B')) return 'general';
  return 'general';
}

function normalizeLondonStatus(decision: string | undefined): string {
  const d = (decision || '').toLowerCase();
  if (d.includes('granted') || d.includes('approved')) return 'approved';
  if (d.includes('pending') || d.includes('undecided')) return 'pending';
  if (d.includes('refused') || d.includes('withdrawn')) return 'revoked';
  return 'pending';
}

export class LondonAdapter extends BaseCityAdapter {
  constructor(config: CityAdapterConfig) {
    super(config);
  }

  async *fetchPermits(options: FetchOptions): AsyncGenerator<RawPermitBatch> {
    let page = options.offset ? Math.floor(options.offset / 100) + 1 : 1;
    const limit = options.limit || 100;
    let hasMore = true;

    while (hasMore) {
      const url = `${this.config.apiBaseUrl}?page=${page}&per_page=${limit}`;

      const data = await withRetry(async () => {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'X-API-AllowRequest': 'true',
          },
        });
        if (!response.ok) {
          throw new Error(`London API error: ${response.status}`);
        }
        return response.json() as Promise<{ data?: unknown[]; records?: unknown[] }>;
      });

      const records = data.data || data.records || [];
      hasMore = (records as unknown[]).length === limit;

      yield {
        records: records as unknown[],
        hasMore,
        nextOffset: hasMore ? page * limit : undefined,
      };

      page++;
    }
  }

  transformToUniversal(raw: unknown): UniversalPermit | null {
    const record = raw as LondonPlanningRecord;
    if (!record.application_number || !record.development_address) return null;

    return {
      globalPermitId: record.application_number,
      issueDate: record.decision_date?.split('T')[0] || null,
      applicationDate: record.received_date?.split('T')[0] || null,
      propertyAddress: record.development_address,
      workDescription: record.development_description || null,
      permitCategory: normalizeLondonCategory(record.use_class_added),
      permitType: record.use_class_added
        ? USE_CLASS_MAP[record.use_class_added.toUpperCase()] || record.use_class_added
        : null,
      status: normalizeLondonStatus(record.decision),
      estimatedCost: null,
      latitude: record.latitude || null,
      longitude: record.longitude || null,
      rawData: record as Record<string, unknown>,
      sourceUrl: 'https://www.london.gov.uk/programmes-strategies/planning/digital-planning/planning-london-datahub',
    };
  }
}
