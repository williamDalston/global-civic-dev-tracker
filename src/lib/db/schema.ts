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

// ============ CONTRACTORS ============
export const contractors = pgTable(
  'contractors',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    companyName: text('company_name').notNull(),
    contactName: text('contact_name').notNull(),
    phone: text('phone').notNull(),
    website: text('website'),
    description: text('description'),
    logoUrl: text('logo_url'),
    slug: text('slug').notNull().unique(),
    licenseNumber: text('license_number'),
    insuranceVerified: boolean('insurance_verified').default(false),
    yearsInBusiness: integer('years_in_business'),
    employeeCount: text('employee_count'),
    status: text('status').default('pending'),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    billingPlan: text('billing_plan').default('per_lead'),
    leadCredits: integer('lead_credits').default(0),
    monthlyLeadLimit: integer('monthly_lead_limit'),
    leadsThisMonth: integer('leads_this_month').default(0),
    lastLeadResetAt: timestamp('last_lead_reset_at', { withTimezone: true }),
    emailVerified: boolean('email_verified').default(false),
    emailVerifyToken: text('email_verify_token'),
    passwordResetToken: text('password_reset_token'),
    passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_contractors_email').on(table.email),
    index('idx_contractors_slug').on(table.slug),
    index('idx_contractors_status').on(table.status),
    index('idx_contractors_stripe').on(table.stripeCustomerId),
  ]
);

export const contractorsRelations = relations(contractors, ({ many }) => ({
  serviceAreas: many(contractorServiceAreas),
  categories: many(contractorCategories),
  leadAssignments: many(leadAssignments),
}));

// ============ CONTRACTOR SERVICE AREAS ============
export const contractorServiceAreas = pgTable(
  'contractor_service_areas',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    contractorId: bigint('contractor_id', { mode: 'number' })
      .notNull()
      .references(() => contractors.id, { onDelete: 'cascade' }),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id),
    neighborhoodId: integer('neighborhood_id').references(() => neighborhoods.id),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_contractor_areas_contractor').on(table.contractorId),
    index('idx_contractor_areas_city').on(table.cityId),
    uniqueIndex('idx_contractor_areas_unique').on(
      table.contractorId,
      table.cityId,
      table.neighborhoodId
    ),
  ]
);

export const contractorServiceAreasRelations = relations(contractorServiceAreas, ({ one }) => ({
  contractor: one(contractors, {
    fields: [contractorServiceAreas.contractorId],
    references: [contractors.id],
  }),
  city: one(cities, {
    fields: [contractorServiceAreas.cityId],
    references: [cities.id],
  }),
  neighborhood: one(neighborhoods, {
    fields: [contractorServiceAreas.neighborhoodId],
    references: [neighborhoods.id],
  }),
}));

// ============ CONTRACTOR CATEGORIES ============
export const contractorCategories = pgTable(
  'contractor_categories',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    contractorId: bigint('contractor_id', { mode: 'number' })
      .notNull()
      .references(() => contractors.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_contractor_cats_contractor').on(table.contractorId),
    index('idx_contractor_cats_category').on(table.category),
    uniqueIndex('idx_contractor_cats_unique').on(table.contractorId, table.category),
  ]
);

export const contractorCategoriesRelations = relations(contractorCategories, ({ one }) => ({
  contractor: one(contractors, {
    fields: [contractorCategories.contractorId],
    references: [contractors.id],
  }),
}));

// ============ LEAD ASSIGNMENTS ============
export const leadAssignments = pgTable(
  'lead_assignments',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    leadId: bigint('lead_id', { mode: 'number' })
      .notNull()
      .references(() => leads.id),
    contractorId: bigint('contractor_id', { mode: 'number' })
      .notNull()
      .references(() => contractors.id),
    status: text('status').default('pending'),
    priceCharged: numeric('price_charged', { precision: 10, scale: 2 }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }),
    contactedAt: timestamp('contacted_at', { withTimezone: true }),
    outcome: text('outcome'),
    feedback: text('feedback'),
    disputeReason: text('dispute_reason'),
    disputeResolvedAt: timestamp('dispute_resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_lead_assignments_lead').on(table.leadId),
    index('idx_lead_assignments_contractor').on(table.contractorId),
    index('idx_lead_assignments_status').on(table.status),
    uniqueIndex('idx_lead_assignments_unique').on(table.leadId, table.contractorId),
  ]
);

export const leadAssignmentsRelations = relations(leadAssignments, ({ one }) => ({
  lead: one(leads, {
    fields: [leadAssignments.leadId],
    references: [leads.id],
  }),
  contractor: one(contractors, {
    fields: [leadAssignments.contractorId],
    references: [contractors.id],
  }),
}));

// ============ CONTRACTOR BILLING HISTORY ============
export const contractorBillingHistory = pgTable(
  'contractor_billing_history',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    contractorId: bigint('contractor_id', { mode: 'number' })
      .notNull()
      .references(() => contractors.id),
    type: text('type').notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    description: text('description'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeInvoiceId: text('stripe_invoice_id'),
    leadAssignmentId: bigint('lead_assignment_id', { mode: 'number' }).references(
      () => leadAssignments.id
    ),
    status: text('status').default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_billing_contractor').on(table.contractorId),
    index('idx_billing_status').on(table.status),
    index('idx_billing_created').on(table.createdAt),
  ]
);

// ============ LEAD PRICING ============
export const leadPricing = pgTable('lead_pricing', {
  id: serial('id').primaryKey(),
  cityId: integer('city_id').references(() => cities.id),
  category: text('category').notNull(),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  premiumMultiplier: numeric('premium_multiplier', { precision: 4, scale: 2 }).default('1.00'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
