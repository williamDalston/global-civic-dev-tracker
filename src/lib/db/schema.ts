import {
  pgTable,
  serial,
  bigserial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  date,
  uniqueIndex,
  index,
  bigint,
  doublePrecision,
  char,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ COUNTRIES ============
export const countries = pgTable('countries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  code: char('code', { length: 2 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const countriesRelations = relations(countries, ({ many }) => ({
  cities: many(cities),
}));

// ============ CITIES ============
export const cities = pgTable(
  'cities',
  {
    id: serial('id').primaryKey(),
    countryId: integer('country_id')
      .notNull()
      .references(() => countries.id),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    timezone: text('timezone').notNull(),
    centerLat: doublePrecision('center_lat'),
    centerLng: doublePrecision('center_lng'),
    apiSource: text('api_source').notNull(),
    apiConfig: jsonb('api_config').notNull().default({}),
    etlEnabled: boolean('etl_enabled').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex('idx_cities_slug').on(table.slug)]
);

export const citiesRelations = relations(cities, ({ one, many }) => ({
  country: one(countries, {
    fields: [cities.countryId],
    references: [countries.id],
  }),
  neighborhoods: many(neighborhoods),
  permits: many(permits),
}));

// ============ NEIGHBORHOODS ============
export const neighborhoods = pgTable(
  'neighborhoods',
  {
    id: serial('id').primaryKey(),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    clusterId: text('cluster_id'),
    centerLat: doublePrecision('center_lat'),
    centerLng: doublePrecision('center_lng'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_neighborhoods_city_slug').on(table.cityId, table.slug),
    index('idx_neighborhoods_city').on(table.cityId),
  ]
);

export const neighborhoodsRelations = relations(neighborhoods, ({ one, many }) => ({
  city: one(cities, {
    fields: [neighborhoods.cityId],
    references: [cities.id],
  }),
  permits: many(permits),
}));

// ============ PERMITS ============
export const permits = pgTable(
  'permits',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    globalPermitId: text('global_permit_id').notNull(),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id),
    neighborhoodId: integer('neighborhood_id').references(() => neighborhoods.id),
    issueDate: date('issue_date'),
    applicationDate: date('application_date'),
    propertyAddress: text('property_address').notNull(),
    workDescription: text('work_description'),
    permitCategory: text('permit_category').notNull(),
    permitType: text('permit_type'),
    status: text('status').notNull().default('approved'),
    estimatedCost: numeric('estimated_cost', { precision: 15, scale: 2 }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    slug: text('slug').notNull(),
    aiNarrative: text('ai_narrative'),
    aiGeneratedAt: timestamp('ai_generated_at', { withTimezone: true }),
    narrativeVersion: integer('narrative_version').default(0),
    rawData: jsonb('raw_data').notNull().default({}),
    sourceUrl: text('source_url'),
    indexedAt: timestamp('indexed_at', { withTimezone: true }),
    lastImpression: timestamp('last_impression', { withTimezone: true }),
    noindex: boolean('noindex').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_permits_city_global_id').on(table.cityId, table.globalPermitId),
    index('idx_permits_city_neighborhood').on(table.cityId, table.neighborhoodId),
    index('idx_permits_city_slug').on(table.cityId, table.slug),
    index('idx_permits_issue_date').on(table.issueDate),
    index('idx_permits_category').on(table.permitCategory),
    index('idx_permits_status').on(table.status),
    index('idx_permits_updated').on(table.updatedAt),
  ]
);

export const permitsRelations = relations(permits, ({ one }) => ({
  city: one(cities, {
    fields: [permits.cityId],
    references: [cities.id],
  }),
  neighborhood: one(neighborhoods, {
    fields: [permits.neighborhoodId],
    references: [neighborhoods.id],
  }),
}));

// ============ ETL SYNC STATE ============
export const etlSyncState = pgTable('etl_sync_state', {
  id: serial('id').primaryKey(),
  cityId: integer('city_id')
    .notNull()
    .references(() => cities.id)
    .unique(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  lastOffset: bigint('last_offset', { mode: 'number' }).default(0),
  lastRecordId: text('last_record_id'),
  recordsSynced: bigint('records_synced', { mode: 'number' }).default(0),
  status: text('status').default('idle'),
  errorMessage: text('error_message'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============ LEADS ============
export const leads = pgTable(
  'leads',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    permitId: bigint('permit_id', { mode: 'number' }).references(() => permits.id),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id),
    neighborhoodId: integer('neighborhood_id').references(() => neighborhoods.id),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    message: text('message'),
    workType: text('work_type'),
    status: text('status').default('new'),
    routedTo: jsonb('routed_to'),
    routedAt: timestamp('routed_at', { withTimezone: true }),
    sourceUrl: text('source_url'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_leads_status').on(table.status), index('idx_leads_city').on(table.cityId)]
);

// ============ SITEMAP TRACKING ============
export const sitemapTracking = pgTable(
  'sitemap_tracking',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    urlPath: text('url_path').notNull().unique(),
    pageType: text('page_type').notNull(),
    lastModified: timestamp('last_modified', { withTimezone: true }).notNull(),
    indexnowSent: boolean('indexnow_sent').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_sitemap_page_type').on(table.pageType),
    index('idx_sitemap_modified').on(table.lastModified),
  ]
);
