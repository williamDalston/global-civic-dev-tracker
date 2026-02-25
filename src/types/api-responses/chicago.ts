/** Chicago Building Permits (Socrata dataset ydr8-5enu) */
export interface ChicagoPermitRaw {
  id?: string;
  permit_?: string;
  permit_type?: string;
  review_type?: string;
  application_start_date?: string;
  issue_date?: string;
  processing_time?: string;
  street_number?: string;
  street_direction?: string;
  street_name?: string;
  suffix?: string;
  work_description?: string;
  building_fee_paid?: string;
  zoning_fee_paid?: string;
  other_fee_paid?: string;
  subtotal_paid?: string;
  building_fee_unpaid?: string;
  zoning_fee_unpaid?: string;
  other_fee_unpaid?: string;
  subtotal_unpaid?: string;
  building_fee_waived?: string;
  zoning_fee_waived?: string;
  other_fee_waived?: string;
  subtotal_waived?: string;
  total_fee?: string;
  contact_1_type?: string;
  contact_1_name?: string;
  contact_1_city?: string;
  contact_1_state?: string;
  contact_1_zipcode?: string;
  reported_cost?: string;
  pin1?: string;
  pin2?: string;
  pin3?: string;
  pin4?: string;
  pin5?: string;
  pin6?: string;
  pin7?: string;
  pin8?: string;
  pin9?: string;
  pin10?: string;
  community_area?: string;
  census_tract?: string;
  ward?: string;
  xcoordinate?: string;
  ycoordinate?: string;
  latitude?: string;
  longitude?: string;
  location?: {
    latitude?: string;
    longitude?: string;
    human_address?: string;
  };
}

/** Chicago Community Area mapping (subset) */
export const CHICAGO_COMMUNITY_AREAS: Record<string, string> = {
  '1': 'Rogers Park',
  '2': 'West Ridge',
  '3': 'Uptown',
  '4': 'Lincoln Square',
  '5': 'North Center',
  '6': 'Lake View',
  '7': 'Lincoln Park',
  '8': 'Near North Side',
  '22': 'Logan Square',
  '24': 'West Town',
  '28': 'Near West Side',
  '32': 'Loop',
  '33': 'Near South Side',
  '41': 'Hyde Park',
  '56': 'Garfield Ridge',
  '76': 'O\'Hare',
  '77': 'Edgewater',
};
