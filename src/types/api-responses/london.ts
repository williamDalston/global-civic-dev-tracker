/** London Planning Applications API response */
export interface LondonApplicationRaw {
  application_reference?: string;
  application_type?: string;
  application_type_full?: string;
  decision?: string;
  decision_date?: string;
  development_description?: string;
  development_address?: string;
  easting?: number;
  northing?: number;
  latitude?: number;
  longitude?: number;
  lpa_name?: string;
  lpa_code?: string;
  received_date?: string;
  status?: string;
  use_class_original?: string;
  use_class_proposed?: string;
  ward_name?: string;
  ward_code?: string;
  conservation_area?: string;
  listed_building?: string;
  green_belt?: string;
}

/** London Use Class mapping */
export const LONDON_USE_CLASSES: Record<string, string> = {
  A1: 'Shops',
  A2: 'Financial and Professional Services',
  A3: 'Restaurants and Cafes',
  A4: 'Drinking Establishments',
  A5: 'Hot Food Takeaways',
  B1: 'Business',
  B2: 'General Industrial',
  B8: 'Storage or Distribution',
  C1: 'Hotels',
  C2: 'Residential Institutions',
  C3: 'Dwellinghouses',
  C4: 'Houses in Multiple Occupation',
  D1: 'Non-Residential Institutions',
  D2: 'Assembly and Leisure',
  E: 'Commercial, Business and Service',
  F1: 'Learning and Non-Residential Institutions',
  F2: 'Local Community',
};

/** London Planning Data API paginated response wrapper */
export interface LondonAPIResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LondonApplicationRaw[];
}
