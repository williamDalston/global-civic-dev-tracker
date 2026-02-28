import { ImageResponse } from 'next/og';
import { CITIES } from '@/lib/config/cities';
import { COUNTRIES } from '@/lib/config/countries';
import { SITE_URL } from '@/lib/config/constants';

export const runtime = 'edge';
export const alt = 'Neighborhood Building Permits';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ country: string; city: string; neighborhood: string }>;
}) {
  const { country: countrySlug, city: citySlug, neighborhood: neighborhoodSlug } = await params;

  const city = CITIES.find((c) => c.slug === citySlug && c.countrySlug === countrySlug);
  const country = COUNTRIES.find((c) => c.slug === countrySlug);

  const neighborhoodName = neighborhoodSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#09090b',
          padding: '60px',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#3b82f6',
              letterSpacing: '-0.02em',
            }}
          >
            Global Civic Development Tracker
          </div>
          <div
            style={{
              fontSize: 18,
              color: '#a1a1aa',
            }}
          >
            {country?.name ?? ''}
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            gap: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#1e3a5f',
                color: '#60a5fa',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              Neighborhood
            </div>
          </div>

          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: '#fafafa',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            {neighborhoodName}
          </div>

          <div
            style={{
              fontSize: 28,
              color: '#a1a1aa',
            }}
          >
            Building permits in {city?.name ?? citySlug}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #27272a',
            paddingTop: '24px',
          }}
        >
          <div style={{ fontSize: 18, color: '#71717a' }}>
            {neighborhoodName}, {city?.name ?? ''}
          </div>
          <div style={{ fontSize: 18, color: '#71717a' }}>
            {new URL(SITE_URL).hostname}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
