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

function Spain() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#AA151B" />
      <rect x="0" y="15" width="90" height="30" fill="#F1BF00" />
      <rect x="34" y="24" width="8" height="12" rx="1.5" fill="#AA151B" />
    </>
  );
}

function Brazil() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#009B3A" />
      <polygon points="45,7 83,30 45,53 7,30" fill="#FEDF00" />
      <circle cx="45" cy="30" r="12" fill="#002776" />
    </>
  );
}

function Argentina() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#74ACDF" />
      <rect x="0" y="20" width="90" height="20" fill="#FFFFFF" />
      <circle cx="45" cy="30" r="6" fill="#F6B40E" />
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
