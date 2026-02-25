import { BaseCityAdapter } from './base-adapter';
import { withRetry } from '@/lib/utils/retry';
import type { RawPermitBatch, FetchOptions, UniversalPermit, CityAdapterConfig } from '@/types';

interface TorontoPermitRecord {
  permit_num?: string;
  permit_type?: string;
  structure_type?: string;
  work?: string;
  description?: string;
  street_num?: string;
  street_name?: string;
  street_type?: string;
  street_direction?: string;
  postal?: string;
  ward_name?: string;
  issued_date?: string;
  application_date?: string;
  status?: string;
  est_const_cost?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

function normalizeTorontoCategory(work: string | undefined, type: string | undefined): string {
  const w = (work || '').toLowerCase();
  const t = (type || '').toLowerCase();
  if (w.includes('new building') || t.includes('new')) return 'new-construction';
  if (w.includes('addition') || w.includes('alteration') || w.includes('renovation'))
    return 'renovation';
  if (w.includes('demolition') || w.includes('wreck')) return 'demolition';
  if (w.includes('mechanical') || w.includes('hvac')) return 'hvac';
  if (w.includes('plumb')) return 'plumbing';
  if (w.includes('electric')) return 'electrical';
  return 'general';
}

function normalizeTorontoStatus(status: string | undefined): string {
  const s = (status || '').toLowerCase();
  if (s.includes('issued') || s.includes('active') || s.includes('permit issued'))
    return 'approved';
  if (s.includes('application') || s.includes('review') || s.includes('submitted'))
    return 'pending';
  if (s.includes('closed') || s.includes('completed')) return 'completed';
  if (s.includes('cancel') || s.includes('refused')) return 'revoked';
  return 'approved';
}

export class TorontoAdapter extends BaseCityAdapter {
  constructor(config: CityAdapterConfig) {
    super(config);
  }

  async *fetchPermits(options: FetchOptions): AsyncGenerator<RawPermitBatch> {
    // First get the dataset metadata to find the resource URL
    const metaUrl = `${this.config.apiBaseUrl}/package_show?id=${this.config.datasetId}`;

    const meta = await withRetry(async () => {
      const response = await fetch(metaUrl, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Toronto CKAN meta error: ${response.status}`);
      return response.json() as Promise<{
        result?: { resources?: Array<{ url: string; format: string }> };
      }>;
    });

    const resources = meta.result?.resources || [];
    const jsonResource = resources.find(
      (r) => r.format.toLowerCase() === 'json' || r.format.toLowerCase() === 'geojson'
    );
    const csvResource = resources.find((r) => r.format.toLowerCase() === 'csv');
    const resourceUrl = jsonResource?.url || csvResource?.url;

    if (!resourceUrl) {
      yield { records: [], hasMore: false };
      return;
    }

    // Fetch the actual data using the CKAN datastore API
    let offset = options.offset || 0;
    const limit = options.limit || 10000;
    let hasMore = true;

    while (hasMore) {
      const datastoreUrl = `${this.config.apiBaseUrl}/datastore_search?id=${this.config.datasetId}&limit=${limit}&offset=${offset}`;

      const data = await withRetry(async () => {
        const response = await fetch(datastoreUrl, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`Toronto CKAN data error: ${response.status}`);
        return response.json() as Promise<{
          result?: { records?: unknown[]; total?: number };
        }>;
      });

      const records = data.result?.records || [];
      hasMore = records.length === limit;

      yield {
        records,
        hasMore,
        nextOffset: hasMore ? offset + limit : undefined,
        totalRecords: data.result?.total,
      };

      offset += limit;
    }
  }

  transformToUniversal(raw: unknown): UniversalPermit | null {
    const record = raw as TorontoPermitRecord;
    if (!record.permit_num) return null;

    const parts = [
      record.street_num,
      record.street_name,
      record.street_type,
      record.street_direction,
    ].filter(Boolean);
    const address =
      parts.length > 0 ? `${parts.join(' ')}, Toronto, ON ${record.postal || ''}`.trim() : null;
    if (!address) return null;

    return {
      globalPermitId: record.permit_num,
      issueDate: record.issued_date?.split('T')[0] || null,
      applicationDate: record.application_date?.split('T')[0] || null,
      propertyAddress: address,
      workDescription: record.description || record.work || null,
      permitCategory: normalizeTorontoCategory(record.work, record.structure_type),
      permitType: record.permit_type || null,
      status: normalizeTorontoStatus(record.status),
      estimatedCost: record.est_const_cost ? parseFloat(record.est_const_cost) : null,
      latitude: record.latitude || null,
      longitude: record.longitude || null,
      rawData: record as Record<string, unknown>,
      sourceUrl: 'https://open.toronto.ca/dataset/building-permits-active-permits/',
    };
  }
}
