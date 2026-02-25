import { BaseCityAdapter } from './base-adapter';
import { withRetry } from '@/lib/utils/retry';
import type { RawPermitBatch, FetchOptions, UniversalPermit, CityAdapterConfig } from '@/types';

interface SydneyDARecord {
  application_number?: string;
  application_type?: string;
  development_description?: string;
  development_address?: string;
  lodgement_date?: string;
  determination_date?: string;
  determination_type?: string;
  status?: string;
  council_name?: string;
  estimated_cost?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

function normalizeSydneyCategory(appType: string | undefined): string {
  const t = (appType || '').toLowerCase();
  if (t.includes('new') || t.includes('erect')) return 'new-construction';
  if (t.includes('alter') || t.includes('addition') || t.includes('modif')) return 'renovation';
  if (t.includes('demolit')) return 'demolition';
  return 'general';
}

function normalizeSydneyStatus(status: string | undefined): string {
  const s = (status || '').toLowerCase();
  if (s.includes('approved') || s.includes('determined') || s.includes('granted'))
    return 'approved';
  if (s.includes('pending') || s.includes('lodged') || s.includes('under')) return 'pending';
  if (s.includes('refused') || s.includes('withdrawn') || s.includes('rejected'))
    return 'revoked';
  return 'pending';
}

export class SydneyAdapter extends BaseCityAdapter {
  constructor(config: CityAdapterConfig) {
    super(config);
  }

  async *fetchPermits(options: FetchOptions): AsyncGenerator<RawPermitBatch> {
    let page = options.offset ? Math.floor(options.offset / 100) + 1 : 1;
    const limit = options.limit || 100;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: limit.toString(),
      });

      const url = `${this.config.apiBaseUrl}?${params.toString()}`;

      const data = await withRetry(async () => {
        const headers: Record<string, string> = {
          Accept: 'application/json',
        };
        if (this.config.apiToken) {
          headers['Ocp-Apim-Subscription-Key'] = this.config.apiToken;
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`Sydney API error: ${response.status}`);
        }
        return response.json() as Promise<{ records?: unknown[]; data?: unknown[] }>;
      });

      const records = data.records || data.data || [];
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
    const record = raw as SydneyDARecord;
    if (!record.application_number || !record.development_address) return null;

    return {
      globalPermitId: record.application_number,
      issueDate: record.determination_date?.split('T')[0] || null,
      applicationDate: record.lodgement_date?.split('T')[0] || null,
      propertyAddress: `${record.development_address}, Sydney, NSW`,
      workDescription: record.development_description || null,
      permitCategory: normalizeSydneyCategory(record.application_type),
      permitType: record.application_type || null,
      status: normalizeSydneyStatus(record.status),
      estimatedCost: record.estimated_cost ? parseFloat(record.estimated_cost) : null,
      latitude: record.latitude || null,
      longitude: record.longitude || null,
      rawData: record as Record<string, unknown>,
      sourceUrl: 'https://www.planningportal.nsw.gov.au/opendata/dataset/online-da-data-api',
    };
  }
}
