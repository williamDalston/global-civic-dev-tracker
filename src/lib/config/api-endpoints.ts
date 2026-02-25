export const API_ENDPOINTS = {
  dc: {
    permits: 'https://opendata.dc.gov/api/v3/datasets/building-permits-in-2024/downloads/data',
    neighborhoodClusters: 'https://opendata.dc.gov/api/v3/datasets/neighborhood-clusters/downloads/data',
    existingLandUse: 'https://opendata.dc.gov/api/v3/datasets/existing-land-use/downloads/data',
  },
  nyc: {
    approvedPermits: 'https://data.cityofnewyork.us/resource/rbx6-tga4.json',
    permitIssuance: 'https://data.cityofnewyork.us/resource/ipu4-2q9a.json',
  },
  chicago: {
    permits: 'https://data.cityofchicago.org/resource/ydr8-5enu.json',
  },
  london: {
    applications: 'https://planningdata.london.gov.uk/api-guest/applications',
  },
  sydney: {
    onlineDa: 'https://api.planningportal.nsw.gov.au/online-da',
  },
  toronto: {
    activePermits:
      'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=building-permits-active-permits',
    clearedPermits:
      'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=building-permits-cleared-permits',
  },
  indexNow: 'https://api.indexnow.org/indexnow',
  nominatim: 'https://nominatim.openstreetmap.org/search',
} as const;
