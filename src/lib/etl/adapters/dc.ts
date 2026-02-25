import { SocrataAdapter } from './socrata-adapter';
import { permitSlug } from '@/lib/utils/slugify';
import type { UniversalPermit, CityAdapterConfig } from '@/types';

interface DCPermitRecord {
  permit_id?: string;
  dcra_internal_number?: string;
  issue_date?: string;
  application_date?: string;
  full_address?: string;
  desc_of_work?: string;
  permit_type_name?: string;
  permit_subtype_name?: string;
  permit_category_name?: string;
  application_status_name?: string;
  estimated_cost?: string;
  latitude?: number;
  longitude?: number;
  ssl?: string;
  [key: string]: unknown;
}

function normalizeDCCategory(category: string | undefined, type: string | undefined): string {
  const cat = (category || '').toLowerCase();
  const typ = (type || '').toLowerCase();

  if (cat.includes('construction') || typ.includes('new building')) return 'new-construction';
  if (cat.includes('supplement') || cat.includes('alteration') || typ.includes('alteration'))
    return 'renovation';
  if (cat.includes('demolition') || typ.includes('raze')) return 'demolition';
  if (typ.includes('electrical')) return 'electrical';
  if (typ.includes('plumbing')) return 'plumbing';
  if (typ.includes('mechanical') || typ.includes('hvac')) return 'hvac';
  if (typ.includes('roof')) return 'roofing';
  if (typ.includes('sign')) return 'signage';
  if (typ.includes('elevator')) return 'elevator';
  if (typ.includes('boiler')) return 'boiler';
  return 'general';
}

function normalizeDCStatus(status: string | undefined): string {
  const s = (status || '').toLowerCase();
  if (s.includes('issued') || s.includes('approved')) return 'approved';
  if (s.includes('pending') || s.includes('review') || s.includes('submitted')) return 'pending';
  if (s.includes('completed') || s.includes('closed')) return 'completed';
  if (s.includes('revoked') || s.includes('denied')) return 'revoked';
  if (s.includes('expired')) return 'expired';
  return 'approved';
}

export class DCAdapter extends SocrataAdapter {
  constructor(config: CityAdapterConfig) {
    super(config, { orderField: ':id' });
  }

  protected override getDateField(): string {
    return 'issue_date';
  }

  transformToUniversal(raw: unknown): UniversalPermit | null {
    const record = raw as DCPermitRecord;
    const permitId = record.permit_id || record.dcra_internal_number;
    if (!permitId || !record.full_address) return null;

    return {
      globalPermitId: permitId,
      issueDate: record.issue_date?.split('T')[0] || null,
      applicationDate: record.application_date?.split('T')[0] || null,
      propertyAddress: record.full_address,
      workDescription: record.desc_of_work || null,
      permitCategory: normalizeDCCategory(
        record.permit_category_name,
        record.permit_type_name
      ),
      permitType: record.permit_subtype_name || record.permit_type_name || null,
      status: normalizeDCStatus(record.application_status_name),
      estimatedCost: record.estimated_cost ? parseFloat(record.estimated_cost) : null,
      latitude: record.latitude || null,
      longitude: record.longitude || null,
      rawData: record as Record<string, unknown>,
      sourceUrl: `https://opendata.dc.gov/datasets/building-permits`,
    };
  }
}
