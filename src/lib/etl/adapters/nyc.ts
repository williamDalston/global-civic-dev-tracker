import { SocrataAdapter } from './socrata-adapter';
import type { UniversalPermit, CityAdapterConfig } from '@/types';

interface NYCPermitRecord {
  job_number?: string;
  job_doc_number?: string;
  job_type?: string;
  job_description?: string;
  issued_date?: string;
  filing_date?: string;
  borough?: string;
  house_no?: string;
  street_name?: string;
  city?: string;
  state?: string;
  zip?: string;
  gis_latitude?: string;
  gis_longitude?: string;
  estimated_job_costs?: string;
  approved_date?: string;
  job_status?: string;
  [key: string]: unknown;
}

const BOROUGH_MAP: Record<string, string> = {
  '1': 'Manhattan',
  '2': 'Bronx',
  '3': 'Brooklyn',
  '4': 'Queens',
  '5': 'Staten Island',
  MANHATTAN: 'Manhattan',
  BRONX: 'Bronx',
  BROOKLYN: 'Brooklyn',
  QUEENS: 'Queens',
  'STATEN ISLAND': 'Staten Island',
};

function normalizeNYCCategory(jobType: string | undefined): string {
  const jt = (jobType || '').toLowerCase();
  if (jt.includes('nb') || jt.includes('new building')) return 'new-construction';
  if (jt.includes('a1') || jt.includes('alteration')) return 'renovation';
  if (jt.includes('dm') || jt.includes('demolition')) return 'demolition';
  if (jt.includes('pl') || jt.includes('plumbing')) return 'plumbing';
  if (jt.includes('el') || jt.includes('electrical')) return 'electrical';
  if (jt.includes('bl') || jt.includes('boiler')) return 'boiler';
  if (jt.includes('ev') || jt.includes('elevator')) return 'elevator';
  if (jt.includes('sg') || jt.includes('sign')) return 'signage';
  return 'general';
}

export class NYCAdapter extends SocrataAdapter {
  constructor(config: CityAdapterConfig) {
    super(config, { orderField: ':id', pageSize: 50000 });
  }

  protected override getDateField(): string {
    return 'issued_date';
  }

  transformToUniversal(raw: unknown): UniversalPermit | null {
    const record = raw as NYCPermitRecord;
    const permitId = record.job_number || record.job_doc_number;
    if (!permitId) return null;

    const houseNo = record.house_no || '';
    const street = record.street_name || '';
    const borough = BOROUGH_MAP[record.borough?.toUpperCase() || ''] || record.borough || '';
    const address = `${houseNo} ${street}, ${borough}, NY ${record.zip || ''}`.trim();
    if (!address || address === ', , NY') return null;

    return {
      globalPermitId: permitId,
      issueDate: record.issued_date?.split('T')[0] || record.approved_date?.split('T')[0] || null,
      applicationDate: record.filing_date?.split('T')[0] || null,
      propertyAddress: address,
      workDescription: record.job_description || null,
      permitCategory: normalizeNYCCategory(record.job_type),
      permitType: record.job_type || null,
      status: 'approved',
      estimatedCost: record.estimated_job_costs ? parseFloat(record.estimated_job_costs) : null,
      latitude: record.gis_latitude ? parseFloat(record.gis_latitude) : null,
      longitude: record.gis_longitude ? parseFloat(record.gis_longitude) : null,
      rawData: record as Record<string, unknown>,
      sourceUrl: `https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4`,
    };
  }
}
