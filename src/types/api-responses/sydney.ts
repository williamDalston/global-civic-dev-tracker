/** Sydney Online DA API response */
export interface SydneyDARaw {
  ApplicationId?: string;
  PlanningPortalApplicationNumber?: string;
  ApplicationType?: string;
  ApplicationStatus?: string;
  CouncilName?: string;
  DevelopmentCategory?: string;
  DeterminationAuthority?: string;
  DeterminationDate?: string;
  DevelopmentDescription?: string;
  LodgementDate?: string;
  CostOfDevelopment?: number;
  NumberOfNewDwellings?: number;
  NumberOfExistingDwellings?: number;
  NumberOfStoreys?: number;
  Location?: {
    Lot?: Array<{
      Lot?: string;
      PlanLabel?: string;
    }>;
    FullAddress?: string;
    StreetAddress1?: string;
    StreetAddress2?: string;
    Suburb?: string;
    State?: string;
    PostCode?: string;
    X?: number;
    Y?: number;
  };
}

/** Sydney API paginated response wrapper */
export interface SydneyAPIResponse {
  Application?: SydneyDARaw[];
  TotalCount?: number;
  PageSize?: number;
  PageNumber?: number;
}
