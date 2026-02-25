export interface Lead {
  id: number;
  permitId: number | null;
  cityId: number;
  neighborhoodId: number | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  workType: string | null;
  status: 'new' | 'sent' | 'converted' | 'expired';
  routedTo: string[] | null;
  routedAt: string | null;
  sourceUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  createdAt: string;
}

export interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  workType?: string;
  permitId?: number;
  sourceUrl?: string;
  utmSource?: string;
  utmMedium?: string;
}
