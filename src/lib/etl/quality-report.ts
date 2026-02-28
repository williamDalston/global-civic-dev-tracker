import { db } from '@/lib/db';
import { permits, cities } from '@/lib/db/schema';
import { eq, isNull, isNotNull, sql, and } from 'drizzle-orm';
import type { ETLResult } from '@/types';

export interface CityQualityMetrics {
  citySlug: string;
  totalPermits: number;
  geocodedCount: number;
  geocodeRate: number;
  withNeighborhood: number;
  neighborhoodRate: number;
  withDescription: number;
  descriptionRate: number;
  withCost: number;
  costRate: number;
  withNarrative: number;
  narrativeRate: number;
  noindexCount: number;
}

export interface QualityReport {
  timestamp: string;
  cities: CityQualityMetrics[];
  etlResults: Array<{
    citySlug: string;
    processed: number;
    inserted: number;
    updated: number;
    errorCount: number;
    errorRate: number;
  }>;
  alerts: string[];
}

const GEOCODE_RATE_THRESHOLD = 0.7;
const NEIGHBORHOOD_RATE_THRESHOLD = 0.6;
const DESCRIPTION_RATE_THRESHOLD = 0.5;
const ETL_ERROR_RATE_THRESHOLD = 0.1;

/**
 * Generate a data quality report after an ETL run.
 * Queries live DB metrics per city and flags anomalies.
 */
export async function generateQualityReport(
  etlResults: ETLResult[]
): Promise<QualityReport> {
  const alerts: string[] = [];

  // Query quality metrics per city
  const dbCities = await db.select({ id: cities.id, slug: cities.slug }).from(cities);

  const cityMetrics: CityQualityMetrics[] = [];

  for (const city of dbCities) {
    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        geocoded: sql<number>`COUNT(*) FILTER (WHERE ${permits.latitude} IS NOT NULL AND ${permits.longitude} IS NOT NULL)`,
        withNeighborhood: sql<number>`COUNT(*) FILTER (WHERE ${permits.neighborhoodId} IS NOT NULL)`,
        withDescription: sql<number>`COUNT(*) FILTER (WHERE ${permits.workDescription} IS NOT NULL AND ${permits.workDescription} != '')`,
        withCost: sql<number>`COUNT(*) FILTER (WHERE ${permits.estimatedCost} IS NOT NULL)`,
        withNarrative: sql<number>`COUNT(*) FILTER (WHERE ${permits.aiNarrative} IS NOT NULL)`,
        noindex: sql<number>`COUNT(*) FILTER (WHERE ${permits.noindex} = true)`,
      })
      .from(permits)
      .where(eq(permits.cityId, city.id));

    const total = Number(stats.total) || 0;
    if (total === 0) continue;

    const metrics: CityQualityMetrics = {
      citySlug: city.slug,
      totalPermits: total,
      geocodedCount: Number(stats.geocoded),
      geocodeRate: Number(stats.geocoded) / total,
      withNeighborhood: Number(stats.withNeighborhood),
      neighborhoodRate: Number(stats.withNeighborhood) / total,
      withDescription: Number(stats.withDescription),
      descriptionRate: Number(stats.withDescription) / total,
      withCost: Number(stats.withCost),
      costRate: Number(stats.withCost) / total,
      withNarrative: Number(stats.withNarrative),
      narrativeRate: Number(stats.withNarrative) / total,
      noindexCount: Number(stats.noindex),
    };

    cityMetrics.push(metrics);

    // Generate alerts for anomalies
    if (metrics.geocodeRate < GEOCODE_RATE_THRESHOLD) {
      alerts.push(
        `[${city.slug}] Geocode rate ${(metrics.geocodeRate * 100).toFixed(1)}% is below ${GEOCODE_RATE_THRESHOLD * 100}% threshold`
      );
    }
    if (metrics.neighborhoodRate < NEIGHBORHOOD_RATE_THRESHOLD) {
      alerts.push(
        `[${city.slug}] Neighborhood assignment rate ${(metrics.neighborhoodRate * 100).toFixed(1)}% is below ${NEIGHBORHOOD_RATE_THRESHOLD * 100}% threshold`
      );
    }
    if (metrics.descriptionRate < DESCRIPTION_RATE_THRESHOLD) {
      alerts.push(
        `[${city.slug}] Description rate ${(metrics.descriptionRate * 100).toFixed(1)}% is below ${DESCRIPTION_RATE_THRESHOLD * 100}% threshold`
      );
    }
  }

  // ETL error rate analysis
  const etlSummaries = etlResults.map((r) => {
    const errorRate = r.recordsProcessed > 0 ? r.errors.length / r.recordsProcessed : 0;
    if (errorRate > ETL_ERROR_RATE_THRESHOLD) {
      alerts.push(
        `[${r.citySlug}] ETL error rate ${(errorRate * 100).toFixed(1)}% exceeds ${ETL_ERROR_RATE_THRESHOLD * 100}% threshold`
      );
    }
    if (r.recordsProcessed === 0 && r.errors.length > 0) {
      alerts.push(`[${r.citySlug}] ETL produced zero records with errors: ${r.errors[0]}`);
    }
    return {
      citySlug: r.citySlug,
      processed: r.recordsProcessed,
      inserted: r.recordsInserted,
      updated: r.recordsUpdated,
      errorCount: r.errors.length,
      errorRate,
    };
  });

  return {
    timestamp: new Date().toISOString(),
    cities: cityMetrics,
    etlResults: etlSummaries,
    alerts,
  };
}

/**
 * Log the quality report in a structured format.
 */
export function logQualityReport(report: QualityReport): void {
  console.log('[quality] === DATA QUALITY REPORT ===');
  console.log(`[quality] Timestamp: ${report.timestamp}`);

  for (const city of report.cities) {
    console.log(
      `[quality] ${city.citySlug}: ${city.totalPermits} permits | ` +
        `geocoded ${(city.geocodeRate * 100).toFixed(0)}% | ` +
        `neighborhood ${(city.neighborhoodRate * 100).toFixed(0)}% | ` +
        `description ${(city.descriptionRate * 100).toFixed(0)}% | ` +
        `cost ${(city.costRate * 100).toFixed(0)}% | ` +
        `narrative ${(city.narrativeRate * 100).toFixed(0)}%`
    );
  }

  for (const etl of report.etlResults) {
    console.log(
      `[quality] ETL ${etl.citySlug}: ${etl.processed} processed, ` +
        `${etl.inserted} inserted, ${etl.updated} updated, ` +
        `${etl.errorCount} errors (${(etl.errorRate * 100).toFixed(1)}%)`
    );
  }

  if (report.alerts.length > 0) {
    console.warn(`[quality] ${report.alerts.length} ALERT(S):`);
    for (const alert of report.alerts) {
      console.warn(`[quality]   ${alert}`);
    }
  } else {
    console.log('[quality] No alerts — all metrics within thresholds');
  }
}
