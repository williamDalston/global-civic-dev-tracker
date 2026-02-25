export const SITE_NAME = 'Global Civic Development Tracker';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://civictracker.com';
export const SITE_DESCRIPTION =
  'Track building permits, zoning changes, and development activity across major cities worldwide.';

export const PERMITS_PER_PAGE = 24;
export const SITEMAP_URLS_PER_FILE = 45000;
export const INDEXNOW_BATCH_SIZE = 10000;

export const MIN_NARRATIVE_WORDS = 500;
export const NARRATIVE_UNIQUENESS_THRESHOLD = 0.3;
export const PRUNING_DAYS_THRESHOLD = 180;

export const ISR_REVALIDATE = {
  homepage: 3600,
  country: 3600,
  city: 1800,
  neighborhood: 900,
  permit: 86400,
} as const;

export const PERMIT_CATEGORIES: Record<string, string> = {
  'new-construction': 'New Construction',
  renovation: 'Renovation',
  demolition: 'Demolition',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  roofing: 'Roofing',
  mechanical: 'Mechanical',
  'fire-safety': 'Fire Safety',
  signage: 'Signage',
  elevator: 'Elevator',
  boiler: 'Boiler',
  general: 'General',
  other: 'Other',
};

export const PERMIT_STATUSES: Record<string, string> = {
  approved: 'Approved',
  pending: 'Pending',
  completed: 'Completed',
  revoked: 'Revoked',
  expired: 'Expired',
};
