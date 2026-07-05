'use client';

import { useId, type CSSProperties } from 'react';
import HologramSticker from 'holographic-sticker';
import { talero } from '@/lib/fonts';
import styles from './holo-player-card.module.css';

const HOLO_PATTERN_TEXTURE = 'https://assets.codepen.io/605876/figma-texture.png';

interface CardStat {
  value: number;
  label: string;
}

interface HoloPlayerCardProps {
  /** Shirt / squad number shown top-left. */
  number?: number;
  /** Country flag emoji shown under the number. */
  flag?: string;
  /** Six attribute entries rendered as two bottom columns. */
  stats?: CardStat[];
  portraitSrc?: string;
  /** Hover refraction colors, usually the country flag colors. */
  holoColors?: [string, string, string];
  /** Optional restrained color treatment for special card surfaces. */
  surfaceColors?: [string, string];
  /** Adds a slow automatic light sweep behind the player artwork. */
  surfaceShine?: boolean;
  /** Card width in px — every inner measure scales with it (cqi units). */
  width?: number;
}

const DEFAULT_STATS: CardStat[] = [
  { value: 91, label: 'DIV' },
  { value: 91, label: 'DIV' },
  { value: 91, label: 'DIV' },
  { value: 91, label: 'DIV' },
  { value: 91, label: 'DIV' },
  { value: 91, label: 'DIV' },
];

/**
 * Holographic player card (pointer-reactive foil, refraction, glare).
 * Layer stack and SVG filters follow the holographic-sticker reference recipe.
 */
function HoloPlayerCard({
  number = 93,
  flag = '🇱🇺',
  stats = DEFAULT_STATS,
  portraitSrc = '/cards/player-93.png',
  holoColors = ['#ef2b3d', '#f5f5f5', '#00a2e1'],
  surfaceColors,
  surfaceShine = false,
  width = 320,
}: HoloPlayerCardProps) {
  const columns = [stats.slice(0, 3), stats.slice(3, 6)];
  // Unique per instance (cards render side by side) + light scaled to card size,
  // otherwise the specular hotspot blows out white on small cards.
  const lightingId = `hologram-lighting-${useId().replace(/:/g, '')}`;
  const lightScale = width / 320;
  const holoStyle = {
    '--holo-1': holoColors[0],
    '--holo-2': holoColors[1],
    '--holo-3': holoColors[2],
    // The lib clamps .sticker-card with max-width: var(--sticker-card-width, 260px)
    // and its width prop only sets inline width — set the var or cards never exceed 260px.
    '--sticker-card-width': `${width}px`,
    minHeight: 0, // the lib's .sticker-root forces 400px, which breaks small cards
  } as CSSProperties;

  return (
    <HologramSticker.Root style={holoStyle}>
      <HologramSticker.Scene>
        <HologramSticker.Card width={width}>
          {/* Layer 1: solid base + card texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: surfaceColors ? `linear-gradient(145deg, ${surfaceColors[0]}, ${surfaceColors[1]})` : '#101013',
              borderRadius: '8cqi',
            }}
          />
          {surfaceColors ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '8cqi',
                backgroundColor: surfaceColors[0],
                backgroundImage: `linear-gradient(145deg, ${surfaceColors[0]}, ${surfaceColors[1]}), url('/cards/card-texture.png')`,
                backgroundBlendMode: 'color, normal',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                overflow: 'hidden',
              }}
            >
              {surfaceShine && <span className={styles.surfaceShine} />}
            </div>
          ) : (
            <HologramSticker.ImageLayer src="/cards/card-texture.png" alt="" objectFit="cover" />
          )}

          {/* Layer 2: holographic pattern */}
          <HologramSticker.Pattern textureUrl={HOLO_PATTERN_TEXTURE} opacity={0.4} mixBlendMode="multiply">
            <HologramSticker.Refraction intensity={1} className={styles.holoRefraction} />
          </HologramSticker.Pattern>

          {/* Layer 3: faded club watermark behind the character */}
          <HologramSticker.Watermark imageUrl="/cards/fade-logo.png" opacity={0.35}>
            <HologramSticker.Refraction intensity={1} className={styles.holoRefraction} />
          </HologramSticker.Watermark>

          {/* Layer 4: content inside embossed frame */}
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

              {/* Squad number + country flag */}
              <div
                style={{
                  position: 'absolute',
                  top: '7cqi',
                  left: '8cqi',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2cqi',
                  lineHeight: 1,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  zIndex: 100,
                }}
              >
                <span
                  className={talero.className}
                  style={{
                    fontSize: '16cqi',
                    fontWeight: 400,
                    color: '#fff',
                    textShadow: '0 0.4cqi 1.2cqi rgb(0 0 0 / 0.65)',
                  }}
                >
                  {number}
                </span>
                <span style={{ fontSize: '9cqi' }}>{flag}</span>
              </div>

              {/* Portrait */}
              <HologramSticker.ImageLayer src={portraitSrc} alt="" parallax />

              {/* Bottom stats: two columns with divider */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(8cqi * 0.9)',
                  left: '8cqi',
                  right: '8cqi',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1px 1fr',
                  zIndex: 100,
                }}
              >
                {columns.map((column, columnIndex) => (
                  <div
                    key={columnIndex}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5cqi',
                      alignItems: 'center',
                      gridColumn: columnIndex === 0 ? 1 : 3,
                    }}
                  >
                    {column.map((stat, statIndex) => (
                      <span key={statIndex} style={{ fontSize: '6.5cqi', fontWeight: 700, lineHeight: 1 }}>
                        <span
                          className={talero.className}
                          style={{ fontWeight: 400, color: 'hsl(0 0% 92%)', textShadow: '0 0.3cqi 0.9cqi rgb(0 0 0 / 0.6)' }}
                        >
                          {stat.value}
                        </span>{' '}
                        <span style={{ color: 'hsl(0 0% 58%)', fontWeight: 500 }}>{stat.label}</span>
                      </span>
                    ))}
                  </div>
                ))}
                <div style={{ gridColumn: 2, gridRow: '1', background: 'hsl(0 0% 35%)', opacity: 0.6 }} />
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

export { HoloPlayerCard };
export type { HoloPlayerCardProps, CardStat };
