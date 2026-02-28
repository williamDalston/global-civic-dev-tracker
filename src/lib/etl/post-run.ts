import { db } from '@/lib/db';
import { permits, cities, neighborhoods, countries } from '@/lib/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { submitToIndexNow, buildPermitUrl } from '@/lib/seo/indexnow';
import { processNarrativeBatch } from '@/lib/etl/ai/batch-processor';
import { generateQualityReport, logQualityReport } from '@/lib/etl/quality-report';
import { CITIES } from '@/lib/config/cities';
import { SITE_URL } from '@/lib/config/constants';
import type { ETLResult } from '@/types';

/**
 * After ETL completes, trigger ISR revalidation, IndexNow submission, and narrative queueing.
 * All operations are best-effort — failures are logged but don't throw.
 */
export async function runPostETLHooks(results: ETLResult[]): Promise<void> {
  const citiesWithNewData = results.filter(
    (r) => r.recordsInserted > 0 || r.recordsUpdated > 0
  );

  if (citiesWithNewData.length === 0) {
    console.log('[post-etl] No new data — skipping hooks');
    return;
  }

  await Promise.allSettled([
    revalidateAffectedPages(citiesWithNewData),
    submitNewUrlsToIndexNow(),
    queueNarrativeGeneration(),
    runQualityCheck(results),
  ]);
}

/**
 * Revalidate city, country, and homepage paths via the app's own revalidation API route.
 */
async function revalidateAffectedPages(results: ETLResult[]): Promise<void> {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) {
    console.log('[post-etl] REVALIDATION_SECRET not set — skipping ISR revalidation');
    return;
  }

  const paths: string[] = [];

  for (const result of results) {
    const city = CITIES.find((c) => c.slug === result.citySlug);
    if (!city) continue;

    // Revalidate the city page
    paths.push(`/${city.countrySlug}/${city.slug}`);
    // Revalidate the country page
    paths.push(`/${city.countrySlug}`);
  }

  // Always revalidate homepage when there's new data
  paths.push('/');

  // Deduplicate
  const uniquePaths = [...new Set(paths)];

  try {
    const response = await fetch(`${SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ paths: uniquePaths }),
    });

    if (response.ok) {
      console.log(`[post-etl] Revalidated ${uniquePaths.length} paths: ${uniquePaths.join(', ')}`);
    } else {
      console.warn(`[post-etl] Revalidation failed: HTTP ${response.status}`);
    }
  } catch (err) {
    console.error('[post-etl] Revalidation error:', err);
  }
}

/**
 * Submit recently updated/created permit URLs to IndexNow for fast search engine indexing.
 * Uses the direct IndexNow utility rather than the API route to avoid self-referential calls.
 */
async function submitNewUrlsToIndexNow(): Promise<void> {
  if (!process.env.INDEXNOW_KEY) {
    console.log('[post-etl] INDEXNOW_KEY not set — skipping IndexNow submission');
    return;
  }

  try {
    // Query recently updated permits with their full URL path components
    const recentPermits = await db
      .select({
        permitSlug: permits.slug,
        citySlug: cities.slug,
        neighborhoodSlug: neighborhoods.slug,
        countrySlug: countries.slug,
      })
      .from(permits)
      .innerJoin(cities, eq(permits.cityId, cities.id))
      .innerJoin(neighborhoods, eq(permits.neighborhoodId, neighborhoods.id))
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .where(
        and(
          sql`${permits.updatedAt} >= NOW() - INTERVAL '24 hours'`,
          eq(permits.noindex, false)
        )
      )
      .limit(10000);

    if (recentPermits.length === 0) {
      console.log('[post-etl] No recent permits to submit to IndexNow');
      return;
    }

    const urls = recentPermits.map((p) =>
      buildPermitUrl(p.countrySlug, p.citySlug, p.neighborhoodSlug, p.permitSlug)
    );

    const result = await submitToIndexNow(urls);

    if (result.errors.length > 0) {
      console.warn(`[post-etl] IndexNow partial failure: ${result.errors.join('; ')}`);
    }

    console.log(
      `[post-etl] IndexNow: submitted ${result.submitted}/${urls.length} URLs in ${result.batches} batch(es)`
    );
  } catch (err) {
    console.error('[post-etl] IndexNow error:', err);
  }
}

/**
 * Run data quality check across all cities and log anomalies.
 */
async function runQualityCheck(results: ETLResult[]): Promise<void> {
  try {
    const report = await generateQualityReport(results);
    logQualityReport(report);
  } catch (err) {
    console.error('[post-etl] Quality report error:', err);
  }
}

/**
 * Queue permits without AI narratives for generation.
 * Uses the existing batch processor which handles quality gates and uniqueness checks.
 */
async function queueNarrativeGeneration(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.log('[post-etl] OPENAI_API_KEY not set — skipping narrative generation');
    return;
  }

  try {
    // Check how many permits need narratives
    const pending = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(permits)
      .where(and(isNull(permits.aiNarrative), eq(permits.noindex, false)));

    const pendingCount = pending[0]?.count ?? 0;

    if (pendingCount === 0) {
      console.log('[post-etl] No permits pending narrative generation');
      return;
    }

    console.log(`[post-etl] ${pendingCount} permits pending narrative generation — processing batch`);

    // Process a batch (capped to avoid long-running functions)
    const result = await processNarrativeBatch(50);

    console.log(
      `[post-etl] Narratives: ${result.succeeded}/${result.processed} generated, ${result.failed} failed`
    );

    if (result.errors.length > 0) {
      console.warn(`[post-etl] Narrative errors: ${result.errors.slice(0, 5).join('; ')}`);
    }
  } catch (err) {
    console.error('[post-etl] Narrative generation error:', err);
  }
}
