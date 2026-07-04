'use client';

import { useId, type CSSProperties } from 'react';
import HologramSticker from 'holographic-sticker';
import { talero } from '@/lib/fonts';
import styles from '@/components/store/holo-player-card.module.css';

const HOLO_PATTERN_TEXTURE = 'https://assets.codepen.io/605876/figma-texture.png';

interface NotFoundCardProps {
  /** Card width in px — every inner measure scales with it (cqi units). */
  width?: number;
  /** Hover refraction colors; defaults to the Neon Turf lime set. */
  holoColors?: [string, string, string];
}

/**
 * 404 collectible: the holographic player-card treatment (foil, refraction, glare, emboss frame)
 * with a big shirt-number "404" in the middle instead of a player. Rendered by `app/not-found.tsx`.
 */
function NotFoundCard({ width = 320, holoColors = ['#aef019', '#f5f5f5', '#3ddc84'] }: NotFoundCardProps) {
  const lightingId = `hologram-lighting-${useId().replace(/:/g, '')}`;
  const lightScale = width / 320;
  const holoStyle = {
    '--holo-1': holoColors[0],
    '--holo-2': holoColors[1],
    '--holo-3': holoColors[2],
    // The lib clamps .sticker-card with max-width: var(--sticker-card-width, 260px).
    '--sticker-card-width': `${width}px`,
    minHeight: 0, // the lib's .sticker-root forces 400px, which breaks small cards
  } as CSSProperties;

  return (
    <HologramSticker.Root style={holoStyle}>
      <HologramSticker.Scene>
        <HologramSticker.Card width={width}>
          {/* Layer 1: solid base + card texture */}
          <div style={{ position: 'absolute', inset: 0, background: '#101013', borderRadius: '8cqi' }} />
          <HologramSticker.ImageLayer src="/cards/card-texture.png" alt="" objectFit="cover" />

          {/* Layer 2: holographic pattern */}
          <HologramSticker.Pattern textureUrl={HOLO_PATTERN_TEXTURE} opacity={0.4} mixBlendMode="multiply">
            <HologramSticker.Refraction intensity={1} className={styles.holoRefraction} />
          </HologramSticker.Pattern>

          {/* Layer 3: faded club watermark behind the number */}
          <HologramSticker.Watermark imageUrl="/cards/fade-logo.png" opacity={0.35}>
            <HologramSticker.Refraction intensity={1} className={styles.holoRefraction} />
          </HologramSticker.Watermark>

          {/* Layer 4: content inside embossed frame — the shirt-number 404 */}
          <HologramSticker.Content>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                borderRadius: '8cqi',
                filter: `url(#${lightingId})`,
                clipPath: 'inset(0 0 0 0 round 8cqi)',
              }}
            >
              {/* Emboss border */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-1px',
                  border: 'calc((8cqi * 0.5) + 1px) solid hsl(0 0% 10%)',
                  borderRadius: '8cqi',
                  zIndex: 99,
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3cqi',
                  lineHeight: 1,
                }}
              >
                <span
                  className={talero.className}
                  style={{
                    fontSize: '36cqi',
                    fontWeight: 400,
                    color: '#fff',
                    textShadow: '0 0.6cqi 1.8cqi rgb(0 0 0 / 0.65)',
                  }}
                >
                  404
                </span>
                <span
                  style={{
                    fontSize: '4.5cqi',
                    fontWeight: 700,
                    letterSpacing: '0.42em',
                    textIndent: '0.42em',
                    textTransform: 'uppercase',
                    color: 'hsl(0 0% 62%)',
                  }}
                >
                  Page not found
                </span>
              </div>
            </div>
          </HologramSticker.Content>

          {/* Layer 5: spotlight following the pointer */}
          <HologramSticker.Spotlight intensity={1} />

          {/* Layer 6: glare */}
          <HologramSticker.Glare />
        </HologramSticker.Card>
      </HologramSticker.Scene>

      {/* SVG filter used by the emboss frame, scaled to this card's size */}
      <svg className="sr-only" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={lightingId}>
            <feGaussianBlur in="SourceAlpha" stdDeviation={2 * lightScale} result="blur" />
            <feSpecularLighting
              result="lighting"
              in="blur"
              surfaceScale={8 * lightScale}
              specularConstant="12"
              specularExponent="120"
              lightingColor="hsl(0 0% 6%)"
            >
              <fePointLight x={50 * lightScale} y={50 * lightScale} z={300 * lightScale} />
            </feSpecularLighting>
            <feComposite in="lighting" in2="SourceAlpha" operator="in" result="composite" />
            <feComposite
              in="SourceGraphic"
              in2="composite"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="litPaint"
            />
          </filter>
        </defs>
      </svg>
    </HologramSticker.Root>
  );
}

export { NotFoundCard };
export type { NotFoundCardProps };
