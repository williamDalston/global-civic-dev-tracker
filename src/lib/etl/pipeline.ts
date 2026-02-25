import { DCAdapter } from './adapters/dc';
import { NYCAdapter } from './adapters/nyc';
import { ChicagoAdapter } from './adapters/chicago';
import { LondonAdapter } from './adapters/london';
import { SydneyAdapter } from './adapters/sydney';
import { TorontoAdapter } from './adapters/toronto';
import { BaseCityAdapter } from './adapters/base-adapter';
import { normalizePermit } from './transformers/normalize';
import { ensureValidCategory } from './transformers/categorize';
import { batchUpsertPermits } from './loaders/batch-insert';
import { getSyncState, markSyncRunning, markSyncComplete, markSyncFailed } from './loaders/delta-sync';
import { CITIES } from '@/lib/config/cities';
import { db } from '@/lib/db';
import { cities } from '@/lib/db/schema';
import type { CityAdapterConfig, ETLResult } from '@/types';

function createAdapter(config: CityAdapterConfig): BaseCityAdapter {
  switch (config.citySlug) {
    case 'washington-dc':
      return new DCAdapter(config);
    case 'new-york-city':
      return new NYCAdapter(config);
    case 'chicago':
      return new ChicagoAdapter(config);
    case 'london':
      return new LondonAdapter(config);
    case 'sydney':
      return new SydneyAdapter(config);
    case 'toronto':
      return new TorontoAdapter(config);
    default:
      throw new Error(`No adapter for city: ${config.citySlug}`);
  }
}

async function runCityETL(
  cityId: number,
  citySlug: string,
  apiBaseUrl: string,
  datasetId?: string
): Promise<ETLResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let recordsProcessed = 0;
  let recordsInserted = 0;
  let recordsUpdated = 0;

  const config: CityAdapterConfig = {
    citySlug,
    cityId,
    apiBaseUrl,
    apiToken: process.env[`${citySlug.toUpperCase().replace(/-/g, '_')}_API_TOKEN`],
    datasetId,
  };

  try {
    await markSyncRunning(cityId);

    const adapter = createAdapter(config);
    const syncState = await getSyncState(cityId);

    for await (const batch of adapter.fetchPermits({
      since: syncState.lastSyncAt ? new Date(syncState.lastSyncAt) : undefined,
      offset: 0,
    })) {
      const normalizedBatch = batch.records
        .map((raw) => {
          try {
            const universal = adapter.transformToUniversal(raw);
            if (!universal) return null;

            const normalized = normalizePermit(universal);
            normalized.permitCategory = ensureValidCategory(normalized.permitCategory);
            return normalized;
          } catch (err) {
            errors.push(`Transform error: ${err instanceof Error ? err.message : String(err)}`);
            return null;
          }
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      recordsProcessed += batch.records.length;

      if (normalizedBatch.length > 0) {
        const result = await batchUpsertPermits(cityId, normalizedBatch);
        recordsInserted += result.inserted;
        recordsUpdated += result.updated;
      }
    }

    await markSyncComplete(cityId, recordsProcessed);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    errors.push(`Pipeline error: ${errorMsg}`);
    await markSyncFailed(cityId, errorMsg);
  }

  return {
    citySlug,
    recordsProcessed,
    recordsInserted,
    recordsUpdated,
    errors,
    duration: Date.now() - startTime,
  };
}

export async function runFullETL(citySlugs?: string[]): Promise<ETLResult[]> {
  const citiesToRun = citySlugs
    ? CITIES.filter((c) => citySlugs.includes(c.slug))
    : CITIES;

  // Look up actual city IDs from DB
  const dbCities = await db.select({ id: cities.id, slug: cities.slug }).from(cities);
  const slugToId = new Map(dbCities.map((c) => [c.slug, c.id]));

  const results = await Promise.allSettled(
    citiesToRun.map((city) => {
      const cityId = slugToId.get(city.slug);
      if (!cityId) {
        return Promise.reject(new Error(`City "${city.slug}" not found in database`));
      }
      return runCityETL(cityId, city.slug, city.apiBaseUrl, city.datasetId);
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    return {
      citySlug: citiesToRun[index].slug,
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      errors: [result.reason?.message || 'Unknown error'],
      duration: 0,
    };
  });
}
