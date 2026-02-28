import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_URL } from '@/lib/config/constants';

export const runtime = 'edge';
export const alt = 'Global Civic Development Tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              CT
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#3b82f6',
                letterSpacing: '-0.02em',
              }}
            >
              {SITE_NAME}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: '#fafafa',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            Track Building Permits Worldwide
          </div>

          <div
            style={{
              fontSize: 28,
              color: '#a1a1aa',
              lineHeight: 1.4,
            }}
          >
            Real-time development intelligence across 6 cities in 4 countries
          </div>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '8px',
            }}
          >
            {['6 Cities', '4 Countries', '6 Gov APIs', 'Updated Every 6h'].map(
              (stat) => (
                <div
                  key={stat}
                  style={{
                    backgroundColor: '#1e3a5f',
                    color: '#60a5fa',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {stat}
                </div>
              )
            )}
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
            Building Permit Intelligence Platform
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
