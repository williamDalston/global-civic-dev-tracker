/** Toronto Building Permits (CKAN datastore) */
export interface TorontoPermitRaw {
  _id?: number;
  PERMIT_NUM?: string;
  REVISION_NUM?: string;
  PERMIT_TYPE?: string;
  STRUCTURE_TYPE?: string;
  WORK?: string;
  STREET_NUM?: string;
  STREET_NAME?: string;
  STREET_TYPE?: string;
  STREET_DIRECTION?: string;
  POSTAL?: string;
  GEO_ID?: number;
  APPLICATION_DATE?: string;
  ISSUED_DATE?: string;
  COMPLETED_DATE?: string;
  STATUS?: string;
  DESCRIPTION?: string;
  CURRENT_USE?: string;
  PROPOSED_USE?: string;
  DWELLING_UNITS_CREATED?: number;
  DWELLING_UNITS_LOST?: number;
  EST_CONST_COST?: number;
  WARD_GRID?: string;
  LATITUDE?: number;
  LONGITUDE?: number;
}

/** CKAN package_show response */
export interface CKANPackageResponse {
  success: boolean;
  result: {
    id: string;
    name: string;
    resources: Array<{
      id: string;
      name: string;
      format: string;
      url: string;
      datastore_active: boolean;
    }>;
  };
}

/** CKAN datastore_search response */
export interface CKANDatastoreResponse {
  success: boolean;
  result: {
    records: TorontoPermitRaw[];
    total: number;
    limit: number;
    offset: number;
    fields: Array<{ id: string; type: string }>;
  };
}
