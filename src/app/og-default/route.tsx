import { ImageResponse } from 'next/og'
import { site } from '@/lib/site'

export const runtime = 'nodejs'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

/**
 * Default Open Graph image — brand-aligned fallback returned when no
 * page-specific image is available. Rendered dynamically with
 * `next/og`'s ImageResponse so no binary asset is committed.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background:
            'linear-gradient(135deg, #1B2C4D 0%, #12203B 55%, #0B1324 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Red accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '-160px',
            right: '-160px',
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,16,46,0.55) 0%, rgba(200,16,46,0) 70%)',
          }}
        />
        {/* Top row: logo mark + eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#C8102E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              viewBox="0 0 64 48"
              width="36"
              height="28"
              fill="none"
              style={{ display: 'block' }}
            >
              <path d="M6 34 L32 6 L58 34" stroke="#ffffff" strokeWidth={6} strokeLinejoin="miter" />
              <path d="M44 18 H50 V30 H44 Z" fill="#ffffff" />
              <path d="M4 38 H60" stroke="#ffffff" strokeWidth={2.5} />
            </svg>
          </div>
          <span
            style={{
              fontSize: 20,
              letterSpacing: 8,
              color: 'rgba(255,255,255,0.72)',
              textTransform: 'uppercase',
            }}
          >
            FirstClass Immobilier
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 920 }}>
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            Une nouvelle vie commence.
          </span>
          <span
            style={{
              fontSize: 34,
              lineHeight: 1.25,
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 400,
            }}
          >
            Promoteur immobilier agréé à Abidjan — terrains, maisons, ACD inclus.
          </span>
        </div>

        {/* Footer row: domain + pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            {site.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Agréé', 'ACD', '8+ ans', 'Diaspora'].map((pill) => (
              <span
                key={pill}
                style={{
                  fontSize: 18,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'rgba(255,255,255,0.88)',
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
