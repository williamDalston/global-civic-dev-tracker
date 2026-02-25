/** Washington DC Building Permits API response shape (Socrata/ArcGIS Hub) */
export interface DCPermitRaw {
  PERMIT_ID?: string;
  PERMIT_NUMBER?: string;
  PERMIT_TYPE_NAME?: string;
  PERMIT_SUBTYPE_NAME?: string;
  PERMIT_CATEGORY_NAME?: string;
  FULL_ADDRESS?: string;
  STREET_NUMBER?: string;
  STREET_NAME?: string;
  CITY?: string;
  STATE?: string;
  ZIPCODE?: string;
  LATITUDE?: string | number;
  LONGITUDE?: string | number;
  WARD?: string;
  NEIGHBORHOOD_CLUSTER?: string;
  ANC?: string;
  SSL?: string;
  ISSUE_DATE?: string;
  APPLICATION_DATE?: string;
  STATUS?: string;
  DESC_OF_WORK?: string;
  ESTIMATED_COST?: string | number;
  FEES_PAID?: string | number;
  OWNER_NAME?: string;
  APPLICANT_NAME?: string;
  LASTMODIFIEDDATE?: string;
}

/** DC Neighborhood Clusters dataset */
export interface DCNeighborhoodCluster {
  OBJECTID: number;
  NAME: string;
  GIS_ID: string;
  CLUSTER_: string;
  NBH_NAMES: string;
}
