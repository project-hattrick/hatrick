import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/seo';

export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Dynamic default OG/Twitter card — dark stage, neon-lime accent. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'radial-gradient(120% 120% at 15% 0%, #12251a 0%, #0a0d0a 55%)',
          color: '#f4f7f0',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: '#aef019',
              boxShadow: '0 0 32px #aef019',
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>{SITE.name}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
            }}
          >
            <span>Live &amp; Fantasy football,</span>
            <span style={{ color: '#aef019' }}>one platform.</span>
          </div>
          <div style={{ fontSize: 28, color: '#9aa39a', maxWidth: 820 }}>
            Predict real matches in Live Mode · duel friends 1v1 in Fantasy · powered by TxLINE.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
