import type { CSSProperties, ReactElement } from 'react';

/** Inline SVG national flags for the v5 intro card (emoji flags don't render on Windows). Add nations here. */
export type FlagId = 'france' | 'spain' | 'brazil' | 'argentina' | '';

const FRAME = { rx: 4, style: { stroke: 'rgba(0,0,0,0.28)', strokeWidth: 2, fill: 'none' } as const };

function France() {
  return (
    <>
      <rect x="0" y="0" width="30" height="60" fill="#0055A4" />
      <rect x="30" y="0" width="30" height="60" fill="#FFFFFF" />
      <rect x="60" y="0" width="30" height="60" fill="#EF4135" />
    </>
  );
}

/** Rojigualda 1:2:1 with a simplified coat of arms at the hoist (crown + quartered shield + pillars). */
function Spain() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#AA151B" />
      <rect x="0" y="15" width="90" height="30" fill="#F1BF00" />
      {/* Pillars of Hercules */}
      <rect x="21" y="24" width="2.6" height="13" fill="#B8B8B8" />
      <rect x="20" y="22.5" width="4.6" height="2" fill="#B8B8B8" />
      <rect x="40.4" y="24" width="2.6" height="13" fill="#B8B8B8" />
      <rect x="39.4" y="22.5" width="4.6" height="2" fill="#B8B8B8" />
      {/* Crown */}
      <rect x="28.5" y="19.5" width="7" height="3" rx="1" fill="#AA151B" />
      <circle cx="30" cy="19" r="1" fill="#F1BF00" />
      <circle cx="32" cy="18.4" r="1" fill="#F1BF00" />
      <circle cx="34" cy="19" r="1" fill="#F1BF00" />
      {/* Quartered shield: castle / lion / Aragon bars / chains */}
      <path d="M26.5 23.5 h11 v10 a5.5 5.5 0 0 1 -5.5 5 a5.5 5.5 0 0 1 -5.5 -5 z" fill="#FFFFFF" stroke="#7A0F13" strokeWidth="1" />
      <rect x="27.3" y="24.3" width="4.6" height="6.2" fill="#AA151B" />
      <rect x="32.2" y="24.3" width="4.5" height="6.2" fill="#F5F5F5" />
      <circle cx="34.4" cy="27.4" r="1.6" fill="#8A2BE2" opacity="0.75" />
      <rect x="27.3" y="30.8" width="4.6" height="5.4" fill="#F1BF00" />
      <rect x="28" y="30.8" width="1" height="5.4" fill="#AA151B" />
      <rect x="30" y="30.8" width="1" height="5.4" fill="#AA151B" />
      <rect x="32.2" y="30.8" width="4.5" height="5.4" fill="#AA151B" />
      <circle cx="34.4" cy="33.4" r="1.5" fill="#F1BF00" />
    </>
  );
}

/** Green field, yellow rhombus, blue globe crossed by the white band, southern stars. */
function Brazil() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#009B3A" />
      <polygon points="45,6 84,30 45,54 6,30" fill="#FEDF00" />
      <circle cx="45" cy="30" r="13" fill="#002776" />
      <path d="M33.2 33.5 Q45 25.5 56.8 31.5" stroke="#FFFFFF" strokeWidth="3.4" fill="none" />
      <circle cx="40" cy="36.5" r="0.9" fill="#FFFFFF" />
      <circle cx="45.5" cy="38.5" r="0.9" fill="#FFFFFF" />
      <circle cx="50.5" cy="35.8" r="0.9" fill="#FFFFFF" />
      <circle cx="47.5" cy="24.5" r="0.8" fill="#FFFFFF" />
    </>
  );
}

/** Celeste-white-celeste with the Sol de Mayo (rayed golden sun). */
function Argentina() {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return (
      <line
        key={i}
        x1={45 + Math.cos(a) * 6.4}
        y1={30 + Math.sin(a) * 6.4}
        x2={45 + Math.cos(a) * 10.2}
        y2={30 + Math.sin(a) * 10.2}
        stroke="#F6B40E"
        strokeWidth="1.5"
      />
    );
  });
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#74ACDF" />
      <rect x="0" y="20" width="90" height="20" fill="#FFFFFF" />
      {rays}
      <circle cx="45" cy="30" r="5.4" fill="#F6B40E" stroke="#D99E1B" strokeWidth="1" />
    </>
  );
}

const FLAG_BODY: Record<Exclude<FlagId, ''>, () => ReactElement> = {
  france: France,
  spain: Spain,
  brazil: Brazil,
  argentina: Argentina,
};

/** Renders a national flag by id (falls back to a neutral panel for unknown/empty ids). */
export function FlagSvg({ id, className, style }: { id: string; className?: string; style?: CSSProperties }) {
  const Body = FLAG_BODY[id as Exclude<FlagId, ''>];
  return (
    <svg viewBox="0 0 90 60" className={className} style={style} role="img" aria-label={`${id || 'team'} flag`}>
      {Body ? <Body /> : <rect x="0" y="0" width="90" height="60" fill="#334155" />}
      <rect x="1" y="1" width="88" height="58" rx={FRAME.rx} style={FRAME.style} />
    </svg>
  );
}
