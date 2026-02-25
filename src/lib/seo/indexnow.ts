import { API_ENDPOINTS } from '@/lib/config/api-endpoints';
import { SITE_URL, INDEXNOW_BATCH_SIZE } from '@/lib/config/constants';

export interface IndexNowResult {
  submitted: number;
  batches: number;
  errors: string[];
}

export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return { submitted: 0, batches: 0, errors: ['INDEXNOW_KEY not configured'] };
  }

  const result: IndexNowResult = { submitted: 0, batches: 0, errors: [] };

  // Process in batches
  for (let i = 0; i < urls.length; i += INDEXNOW_BATCH_SIZE) {
    const batch = urls.slice(i, i + INDEXNOW_BATCH_SIZE);
    result.batches++;

    try {
      const response = await fetch(API_ENDPOINTS.indexNow, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: new URL(SITE_URL).host,
          key,
          keyLocation: `${SITE_URL}/${key}.txt`,
          urlList: batch,
        }),
      });

      if (response.ok || response.status === 202) {
        result.submitted += batch.length;
      } else {
        result.errors.push(`Batch ${result.batches}: HTTP ${response.status}`);
      }
    } catch (error) {
      result.errors.push(
        `Batch ${result.batches}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return result;
}

export function buildPermitUrl(
  countrySlug: string,
  citySlug: string,
  neighborhoodSlug: string,
  permitSlug: string
): string {
  return `${SITE_URL}/${countrySlug}/${citySlug}/${neighborhoodSlug}/${permitSlug}`;
}

export function buildNeighborhoodUrl(
  countrySlug: string,
  citySlug: string,
  neighborhoodSlug: string
): string {
  return `${SITE_URL}/${countrySlug}/${citySlug}/${neighborhoodSlug}`;
}
