/** NYC DOB Approved Permits (Socrata dataset rbx6-tga4) */
export interface NYCPermitRaw {
  job__?: string;
  doc__?: string;
  borough?: string;
  house__?: string;
  street_name?: string;
  block?: string;
  lot?: string;
  community_board?: string;
  zip_code?: string;
  bldg_type?: string;
  residential?: string;
  special_district_1?: string;
  special_district_2?: string;
  work_type?: string;
  permit_status?: string;
  filing_status?: string;
  permit_type?: string;
  permit_sequence__?: string;
  permit_subtype?: string;
  oil_gas?: string;
  site_fill?: string;
  filing_date?: string;
  issuance_date?: string;
  expiration_date?: string;
  job_start_date?: string;
  permittee_s_first_name?: string;
  permittee_s_last_name?: string;
  permittee_s_business_name?: string;
  permittee_s_phone__?: string;
  permittee_s_license_type?: string;
  permittee_s_license__?: string;
  act_as_superintendent?: string;
  permittee_s_other_title?: string;
  hic_license?: string;
  site_safety_mgr_s_first_name?: string;
  site_safety_mgr_s_last_name?: string;
  site_safety_mgr_business_name?: string;
  superintendent_first___last_name?: string;
  superintendent_business_name?: string;
  owner_s_business_type?: string;
  non_profit?: string;
  owner_s_business_name?: string;
  owner_s_first_name?: string;
  owner_s_last_name?: string;
  owner_s_house__?: string;
  owner_s_house_street_name?: string;
  owner_s_house_city?: string;
  owner_s_house_state?: string;
  owner_s_house_zip_code?: string;
  owner_s_phone__?: string;
  dobrundate?: string;
  gis_latitude?: string;
  gis_longitude?: string;
  gis_council_district?: string;
  gis_census_tract?: string;
  gis_nta?: string;
  gis_bin?: string;
}

/** NYC Borough codes mapping */
export const NYC_BOROUGH_CODES: Record<string, string> = {
  '1': 'Manhattan',
  '2': 'Bronx',
  '3': 'Brooklyn',
  '4': 'Queens',
  '5': 'Staten Island',
};
