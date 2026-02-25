import { SocrataAdapter } from './socrata-adapter';
import type { UniversalPermit, CityAdapterConfig } from '@/types';

interface ChicagoPermitRecord {
  id?: string;
  permit_?: string;
  permit_status?: string;
  permit_type?: string;
  review_type?: string;
  application_start_date?: string;
  issue_date?: string;
  work_description?: string;
  street_number?: string;
  street_direction?: string;
  street_name?: string;
  suffix?: string;
  latitude?: string;
  longitude?: string;
  reported_cost?: string;
  community_area?: string;
  ward?: string;
  [key: string]: unknown;
}

function normalizeChicagoCategory(permitType: string | undefined): string {
  const pt = (permitType || '').toLowerCase();
  if (pt.includes('new construction')) return 'new-construction';
  if (pt.includes('renovation') || pt.includes('alteration')) return 'renovation';
  if (pt.includes('wrecking') || pt.includes('demolition')) return 'demolition';
  if (pt.includes('electrical')) return 'electrical';
  if (pt.includes('easy permit')) return 'general';
  return 'general';
}

function normalizeChicagoStatus(status: string | undefined): string {
  const s = (status || '').toLowerCase();
  if (s.includes('issue') || s.includes('complete')) return 'approved';
  if (s.includes('ready') || s.includes('review') || s.includes('received')) return 'pending';
  if (s.includes('revoked')) return 'revoked';
  if (s.includes('expired')) return 'expired';
  return 'approved';
}

export class ChicagoAdapter extends SocrataAdapter {
  constructor(config: CityAdapterConfig) {
    super(config, { orderField: ':id' });
  }

  protected override getDateField(): string {
    return 'issue_date';
  }

  transformToUniversal(raw: unknown): UniversalPermit | null {
    const record = raw as ChicagoPermitRecord;
    const permitId = record.permit_ || record.id;
    if (!permitId) return null;

    const parts = [
      record.street_number,
      record.street_direction,
      record.street_name,
      record.suffix,
    ].filter(Boolean);
    const address = parts.length > 0 ? `${parts.join(' ')}, Chicago, IL` : null;
    if (!address) return null;

    return {
      globalPermitId: permitId,
      issueDate: record.issue_date?.split('T')[0] || null,
      applicationDate: record.application_start_date?.split('T')[0] || null,
      propertyAddress: address,
      workDescription: record.work_description || null,
      permitCategory: normalizeChicagoCategory(record.permit_type),
      permitType: record.permit_type || null,
      status: normalizeChicagoStatus(record.permit_status),
      estimatedCost: record.reported_cost ? parseFloat(record.reported_cost) : null,
      latitude: record.latitude ? parseFloat(record.latitude) : null,
      longitude: record.longitude ? parseFloat(record.longitude) : null,
      rawData: record as Record<string, unknown>,
      sourceUrl: `https://data.cityofchicago.org/Buildings/Building-Permits/ydr8-5enu`,
    };
  }
}
