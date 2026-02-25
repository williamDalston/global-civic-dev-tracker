/**
 * Seed script for countries, cities, and neighborhoods.
 * Run with: npx tsx scripts/seed.ts
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import { COUNTRIES } from '../src/lib/config/countries';
import { CITIES } from '../src/lib/config/cities';

const NEIGHBORHOODS: Record<string, { name: string; slug: string; clusterId?: string; centerLat?: number; centerLng?: number }[]> = {
  'washington-dc': [
    { name: 'Adams Morgan', slug: 'adams-morgan', clusterId: 'Cluster 1', centerLat: 38.9214, centerLng: -77.0425 },
    { name: 'Anacostia', slug: 'anacostia', clusterId: 'Cluster 33', centerLat: 38.8625, centerLng: -76.9954 },
    { name: 'Bloomingdale', slug: 'bloomingdale', clusterId: 'Cluster 21', centerLat: 38.9172, centerLng: -77.0112 },
    { name: 'Capitol Hill', slug: 'capitol-hill', clusterId: 'Cluster 25', centerLat: 38.8850, centerLng: -76.9955 },
    { name: 'Columbia Heights', slug: 'columbia-heights', clusterId: 'Cluster 2', centerLat: 38.9284, centerLng: -77.0328 },
    { name: 'Dupont Circle', slug: 'dupont-circle', clusterId: 'Cluster 5', centerLat: 38.9096, centerLng: -77.0434 },
    { name: 'Georgetown', slug: 'georgetown', clusterId: 'Cluster 7', centerLat: 38.9076, centerLng: -77.0636 },
    { name: 'Logan Circle', slug: 'logan-circle', clusterId: 'Cluster 6', centerLat: 38.9090, centerLng: -77.0295 },
    { name: 'Navy Yard', slug: 'navy-yard', clusterId: 'Cluster 27', centerLat: 38.8749, centerLng: -76.9949 },
    { name: 'Petworth', slug: 'petworth', clusterId: 'Cluster 17', centerLat: 38.9413, centerLng: -77.0241 },
    { name: 'Shaw', slug: 'shaw', clusterId: 'Cluster 6', centerLat: 38.9129, centerLng: -77.0220 },
    { name: 'Tenleytown', slug: 'tenleytown', clusterId: 'Cluster 13', centerLat: 38.9476, centerLng: -77.0795 },
    { name: 'U Street Corridor', slug: 'u-street-corridor', clusterId: 'Cluster 2', centerLat: 38.9170, centerLng: -77.0350 },
    { name: 'Woodley Park', slug: 'woodley-park', clusterId: 'Cluster 14', centerLat: 38.9247, centerLng: -77.0560 },
    { name: 'H Street NE', slug: 'h-street-ne', clusterId: 'Cluster 25', centerLat: 38.9001, centerLng: -76.9873 },
  ],
  'new-york-city': [
    { name: 'Manhattan - Upper East Side', slug: 'upper-east-side', centerLat: 40.7736, centerLng: -73.9566 },
    { name: 'Manhattan - Upper West Side', slug: 'upper-west-side', centerLat: 40.7870, centerLng: -73.9754 },
    { name: 'Manhattan - Midtown', slug: 'midtown', centerLat: 40.7549, centerLng: -73.9840 },
    { name: 'Manhattan - Chelsea', slug: 'chelsea', centerLat: 40.7465, centerLng: -74.0014 },
    { name: 'Manhattan - East Village', slug: 'east-village', centerLat: 40.7265, centerLng: -73.9815 },
    { name: 'Manhattan - SoHo', slug: 'soho', centerLat: 40.7233, centerLng: -73.9999 },
    { name: 'Manhattan - Tribeca', slug: 'tribeca', centerLat: 40.7163, centerLng: -74.0086 },
    { name: 'Manhattan - Harlem', slug: 'harlem', centerLat: 40.8116, centerLng: -73.9465 },
    { name: 'Brooklyn - Williamsburg', slug: 'williamsburg', centerLat: 40.7081, centerLng: -73.9571 },
    { name: 'Brooklyn - DUMBO', slug: 'dumbo', centerLat: 40.7033, centerLng: -73.9883 },
    { name: 'Brooklyn - Park Slope', slug: 'park-slope', centerLat: 40.6710, centerLng: -73.9812 },
    { name: 'Brooklyn - Bushwick', slug: 'bushwick', centerLat: 40.6944, centerLng: -73.9213 },
    { name: 'Brooklyn - Bed-Stuy', slug: 'bed-stuy', centerLat: 40.6872, centerLng: -73.9418 },
    { name: 'Queens - Astoria', slug: 'astoria', centerLat: 40.7720, centerLng: -73.9301 },
    { name: 'Queens - Long Island City', slug: 'long-island-city', centerLat: 40.7447, centerLng: -73.9485 },
    { name: 'Bronx - South Bronx', slug: 'south-bronx', centerLat: 40.8176, centerLng: -73.9209 },
    { name: 'Staten Island - St. George', slug: 'st-george', centerLat: 40.6433, centerLng: -74.0773 },
  ],
  chicago: [
    { name: 'The Loop', slug: 'the-loop', centerLat: 41.8819, centerLng: -87.6278 },
    { name: 'Lincoln Park', slug: 'lincoln-park', centerLat: 41.9214, centerLng: -87.6513 },
    { name: 'Wicker Park', slug: 'wicker-park', centerLat: 41.9088, centerLng: -87.6796 },
    { name: 'Logan Square', slug: 'logan-square', centerLat: 41.9236, centerLng: -87.7066 },
    { name: 'Hyde Park', slug: 'hyde-park', centerLat: 41.7943, centerLng: -87.5907 },
    { name: 'Pilsen', slug: 'pilsen', centerLat: 41.8564, centerLng: -87.6567 },
    { name: 'Lakeview', slug: 'lakeview', centerLat: 41.9434, centerLng: -87.6553 },
    { name: 'West Loop', slug: 'west-loop', centerLat: 41.8835, centerLng: -87.6495 },
    { name: 'Bronzeville', slug: 'bronzeville', centerLat: 41.8209, centerLng: -87.6170 },
    { name: 'Bucktown', slug: 'bucktown', centerLat: 41.9211, centerLng: -87.6799 },
    { name: 'River North', slug: 'river-north', centerLat: 41.8926, centerLng: -87.6341 },
    { name: 'Old Town', slug: 'old-town', centerLat: 41.9102, centerLng: -87.6358 },
  ],
  london: [
    { name: 'Camden', slug: 'camden', centerLat: 51.5390, centerLng: -0.1426 },
    { name: 'Westminster', slug: 'westminster', centerLat: 51.4975, centerLng: -0.1357 },
    { name: 'Hackney', slug: 'hackney', centerLat: 51.5450, centerLng: -0.0553 },
    { name: 'Islington', slug: 'islington', centerLat: 51.5465, centerLng: -0.1058 },
    { name: 'Tower Hamlets', slug: 'tower-hamlets', centerLat: 51.5203, centerLng: -0.0293 },
    { name: 'Southwark', slug: 'southwark', centerLat: 51.5035, centerLng: -0.0804 },
    { name: 'Lambeth', slug: 'lambeth', centerLat: 51.4571, centerLng: -0.1231 },
    { name: 'Kensington and Chelsea', slug: 'kensington-and-chelsea', centerLat: 51.5020, centerLng: -0.1947 },
    { name: 'Greenwich', slug: 'greenwich', centerLat: 51.4826, centerLng: 0.0077 },
    { name: 'Lewisham', slug: 'lewisham', centerLat: 51.4415, centerLng: -0.0117 },
    { name: 'Hammersmith and Fulham', slug: 'hammersmith-and-fulham', centerLat: 51.4927, centerLng: -0.2339 },
    { name: 'Wandsworth', slug: 'wandsworth', centerLat: 51.4571, centerLng: -0.1818 },
  ],
  sydney: [
    { name: 'Sydney CBD', slug: 'sydney-cbd', centerLat: -33.8688, centerLng: 151.2093 },
    { name: 'North Sydney', slug: 'north-sydney', centerLat: -33.8388, centerLng: 151.2070 },
    { name: 'Surry Hills', slug: 'surry-hills', centerLat: -33.8832, centerLng: 151.2115 },
    { name: 'Newtown', slug: 'newtown', centerLat: -33.8977, centerLng: 151.1791 },
    { name: 'Bondi', slug: 'bondi', centerLat: -33.8914, centerLng: 151.2743 },
    { name: 'Parramatta', slug: 'parramatta', centerLat: -33.8136, centerLng: 151.0034 },
    { name: 'Manly', slug: 'manly', centerLat: -33.7969, centerLng: 151.2876 },
    { name: 'Chatswood', slug: 'chatswood', centerLat: -33.7964, centerLng: 151.1853 },
    { name: 'Pyrmont', slug: 'pyrmont', centerLat: -33.8720, centerLng: 151.1945 },
    { name: 'Redfern', slug: 'redfern', centerLat: -33.8932, centerLng: 151.2030 },
  ],
  toronto: [
    { name: 'Old Toronto', slug: 'old-toronto', centerLat: 43.6532, centerLng: -79.3832 },
    { name: 'Yorkville', slug: 'yorkville', centerLat: 43.6709, centerLng: -79.3935 },
    { name: 'Liberty Village', slug: 'liberty-village', centerLat: 43.6378, centerLng: -79.4209 },
    { name: 'Distillery District', slug: 'distillery-district', centerLat: 43.6503, centerLng: -79.3596 },
    { name: 'Kensington Market', slug: 'kensington-market', centerLat: 43.6547, centerLng: -79.4002 },
    { name: 'The Annex', slug: 'the-annex', centerLat: 43.6697, centerLng: -79.4051 },
    { name: 'Leslieville', slug: 'leslieville', centerLat: 43.6627, centerLng: -79.3275 },
    { name: 'Junction', slug: 'junction', centerLat: 43.6625, centerLng: -79.4650 },
    { name: 'Scarborough', slug: 'scarborough', centerLat: 43.7764, centerLng: -79.2318 },
    { name: 'North York', slug: 'north-york', centerLat: 43.7615, centerLng: -79.4111 },
    { name: 'Etobicoke', slug: 'etobicoke', centerLat: 43.6205, centerLng: -79.5132 },
    { name: 'East York', slug: 'east-york', centerLat: 43.6907, centerLng: -79.3286 },
  ],
};

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Please set it in your .env file.');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log('Seeding countries...');
  const insertedCountries: Record<string, number> = {};
  for (const country of COUNTRIES) {
    const [row] = await db
      .insert(schema.countries)
      .values({ name: country.name, slug: country.slug, code: country.code })
      .onConflictDoNothing()
      .returning({ id: schema.countries.id });
    if (row) {
      insertedCountries[country.slug] = row.id;
      console.log(`  + ${country.name} (id=${row.id})`);
    } else {
      // Already exists, fetch id
      const existing = await db.query.countries.findFirst({
        where: (c, { eq }) => eq(c.slug, country.slug),
      });
      if (existing) insertedCountries[country.slug] = existing.id;
      console.log(`  ~ ${country.name} (already exists)`);
    }
  }

  console.log('\nSeeding cities...');
  const insertedCities: Record<string, number> = {};
  for (const city of CITIES) {
    const countryId = insertedCountries[city.countrySlug];
    if (!countryId) {
      console.error(`  ! Country ${city.countrySlug} not found for city ${city.name}`);
      continue;
    }

    const [row] = await db
      .insert(schema.cities)
      .values({
        countryId,
        name: city.name,
        slug: city.slug,
        timezone: city.timezone,
        centerLat: city.centerLat,
        centerLng: city.centerLng,
        apiSource: city.apiSource,
        apiConfig: { baseUrl: city.apiBaseUrl, datasetId: city.datasetId },
        etlEnabled: true,
      })
      .onConflictDoNothing()
      .returning({ id: schema.cities.id });
    if (row) {
      insertedCities[city.slug] = row.id;
      console.log(`  + ${city.name} (id=${row.id})`);
    } else {
      const existing = await db.query.cities.findFirst({
        where: (c, { eq }) => eq(c.slug, city.slug),
      });
      if (existing) insertedCities[city.slug] = existing.id;
      console.log(`  ~ ${city.name} (already exists)`);
    }
  }

  console.log('\nSeeding neighborhoods...');
  let neighborhoodCount = 0;
  for (const [citySlug, neighborhoods] of Object.entries(NEIGHBORHOODS)) {
    const cityId = insertedCities[citySlug];
    if (!cityId) {
      console.error(`  ! City ${citySlug} not found`);
      continue;
    }

    for (const hood of neighborhoods) {
      const [row] = await db
        .insert(schema.neighborhoods)
        .values({
          cityId,
          name: hood.name,
          slug: hood.slug,
          clusterId: hood.clusterId || null,
          centerLat: hood.centerLat || null,
          centerLng: hood.centerLng || null,
        })
        .onConflictDoNothing()
        .returning({ id: schema.neighborhoods.id });

      if (row) {
        neighborhoodCount++;
        console.log(`  + ${hood.name} → ${citySlug} (id=${row.id})`);
      } else {
        console.log(`  ~ ${hood.name} → ${citySlug} (already exists)`);
      }
    }
  }

  // Seed ETL sync state for each city
  console.log('\nSeeding ETL sync state...');
  for (const [citySlug, cityId] of Object.entries(insertedCities)) {
    await db
      .insert(schema.etlSyncState)
      .values({ cityId, status: 'idle' })
      .onConflictDoNothing();
    console.log(`  + Sync state for ${citySlug}`);
  }

  console.log(`\nDone! Seeded ${Object.keys(insertedCountries).length} countries, ${Object.keys(insertedCities).length} cities, ${neighborhoodCount} neighborhoods.`);
}

seed().catch(console.error);
