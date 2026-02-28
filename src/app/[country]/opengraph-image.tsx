import { ImageResponse } from 'next/og';
import { COUNTRIES } from '@/lib/config/countries';
import { getCitiesByCountry } from '@/lib/config/cities';
import { SITE_URL } from '@/lib/config/constants';

export const runtime = 'edge';
export const alt = 'Country Building Permits';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: countrySlug } = await params;

  const country = COUNTRIES.find((c) => c.slug === countrySlug);
  const cities = getCitiesByCountry(countrySlug);

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
              backgroundColor: '#1e3a5f',
              color: '#60a5fa',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {cities.length} {cities.length === 1 ? 'City' : 'Cities'}
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
              fontSize: 52,
              fontWeight: 800,
              color: '#fafafa',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            Building Permits in {country?.name ?? countrySlug.toUpperCase()}
          </div>

          <div
            style={{
              fontSize: 28,
              color: '#a1a1aa',
            }}
          >
            Track construction activity and development trends
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
              flexWrap: 'wrap',
            }}
          >
            {cities.map((city) => (
              <div
                key={city.slug}
                style={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  color: '#a1a1aa',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: 18,
                }}
              >
                {city.name}
              </div>
            ))}
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
            {country?.name ?? ''}
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
