import { API_ENDPOINTS } from '@/lib/config/api-endpoints';
import { RateLimiter } from '@/lib/utils/rate-limiter';
import { withRetry } from '@/lib/utils/retry';

export interface GeocodedResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

// Nominatim requires max 1 request/second
const geocodeRateLimiter = new RateLimiter(1, 1100);

export async function geocodeAddress(
  address: string,
  city: string,
  country: string
): Promise<GeocodedResult | null> {
  const query = `${address}, ${city}, ${country}`;

  return geocodeRateLimiter.wrap(async () => {
    return withRetry(
      async () => {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          limit: '1',
          addressdetails: '0',
        });

        const response = await fetch(`${API_ENDPOINTS.nominatim}?${params}`, {
          headers: {
            'User-Agent': 'GlobalCivicDevTracker/1.0 (civic-tracker@example.com)',
          },
        });

        if (!response.ok) {
          throw new Error(`Nominatim returned ${response.status}`);
        }

        const results = (await response.json()) as Array<{
          lat: string;
          lon: string;
          display_name: string;
        }>;

        if (results.length === 0) return null;

        return {
          latitude: parseFloat(results[0].lat),
          longitude: parseFloat(results[0].lon),
          displayName: results[0].display_name,
        };
      },
      { maxAttempts: 2, baseDelay: 2000 }
    );
  });
}

export async function batchGeocode(
  addresses: { address: string; city: string; country: string }[]
): Promise<(GeocodedResult | null)[]> {
  const results: (GeocodedResult | null)[] = [];

  for (const item of addresses) {
    const result = await geocodeAddress(item.address, item.city, item.country);
    results.push(result);
  }

  return results;
}
