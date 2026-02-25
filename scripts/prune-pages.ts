/**
 * Page pruning script — marks low-performing pages as noindex.
 * Run with: npx tsx scripts/prune-pages.ts [--dry-run]
 *
 * This script identifies permit pages with zero search impressions
 * after a configurable threshold (default 180 days) and sets their
 * noindex flag to true.
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, eq, lt, isNull, sql } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { PRUNING_DAYS_THRESHOLD } from '../src/lib/config/constants';

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const sqlClient = neon(databaseUrl);
  const db = drizzle(sqlClient, { schema });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - PRUNING_DAYS_THRESHOLD);

  console.log(`Pruning pages older than ${PRUNING_DAYS_THRESHOLD} days (cutoff: ${cutoffDate.toISOString()})`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Find permits that are old, not already noindexed, and have never received impressions
  const candidates = await db
    .select({
      id: schema.permits.id,
      globalPermitId: schema.permits.globalPermitId,
      slug: schema.permits.slug,
      createdAt: schema.permits.createdAt,
      lastImpression: schema.permits.lastImpression,
    })
    .from(schema.permits)
    .where(
      and(
        eq(schema.permits.noindex, false),
        lt(schema.permits.createdAt, cutoffDate),
        isNull(schema.permits.lastImpression)
      )
    )
    .limit(10000);

  console.log(`Found ${candidates.length} candidate pages for pruning.`);

  if (candidates.length === 0) {
    console.log('Nothing to prune.');
    return;
  }

  // Show sample
  console.log('\nSample pages to prune:');
  for (const permit of candidates.slice(0, 10)) {
    console.log(`  - ${permit.globalPermitId} (${permit.slug}) created ${permit.createdAt}`);
  }
  if (candidates.length > 10) {
    console.log(`  ... and ${candidates.length - 10} more`);
  }

  if (dryRun) {
    console.log('\nDry run — no changes made.');
    return;
  }

  // Batch update noindex flag
  const ids = candidates.map((c) => c.id);
  const batchSize = 500;
  let updated = 0;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await db
      .update(schema.permits)
      .set({ noindex: true, updatedAt: new Date() })
      .where(sql`${schema.permits.id} = ANY(${batch})`);
    updated += batch.length;
    console.log(`  Updated ${updated}/${ids.length}`);
  }

  console.log(`\nDone! Marked ${updated} pages as noindex.`);
}

main().catch(console.error);
