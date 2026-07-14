import type { CSSProperties, ReactElement } from 'react';

/** Inline SVG national flags for the v5 intro card (emoji flags don't render on Windows). Add nations here. */
export type FlagId =
  | 'france' | 'spain' | 'brazil' | 'argentina' | 'netherlands' | 'england' | 'norway' | 'switzerland'
  | 'canada' | 'belgium' | 'portugal' | 'germany' | 'croatia' | 'morocco' | 'japan' | 'usa' | 'mexico'
  | 'uruguay' | 'colombia' | 'denmark' | 'poland' | '';

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

/** Horizontal red-white-blue tricolour. */
function Netherlands() {
  return (
    <>
      <rect x="0" y="0" width="90" height="20" fill="#AE1C28" />
      <rect x="0" y="20" width="90" height="20" fill="#FFFFFF" />
      <rect x="0" y="40" width="90" height="20" fill="#21468B" />
    </>
  );
}

/** St George's Cross: white field with a centered red cross. */
function England() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#FFFFFF" />
      <rect x="37" y="0" width="16" height="60" fill="#CE1124" />
      <rect x="0" y="22" width="90" height="16" fill="#CE1124" />
    </>
  );
}

/** Nordic cross: red field, white-fenced blue cross offset to the hoist. */
function Norway() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#BA0C2F" />
      <rect x="24" y="0" width="16" height="60" fill="#FFFFFF" />
      <rect x="0" y="22" width="90" height="16" fill="#FFFFFF" />
      <rect x="28" y="0" width="8" height="60" fill="#00205B" />
      <rect x="0" y="26" width="90" height="8" fill="#00205B" />
    </>
  );
}

/** Red field with a centered white cross. */
function Switzerland() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#D52B1E" />
      <rect x="40" y="16" width="10" height="28" fill="#FFFFFF" />
      <rect x="31" y="25" width="28" height="10" fill="#FFFFFF" />
    </>
  );
}

/** Vertical black-yellow-red tricolour. */
function Belgium() {
  return (
    <>
      <rect x="0" y="0" width="30" height="60" fill="#000000" />
      <rect x="30" y="0" width="30" height="60" fill="#FAE042" />
      <rect x="60" y="0" width="30" height="60" fill="#ED2939" />
    </>
  );
}

/** Red-white-red vertical with a central maple leaf. */
function Canada() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#FFFFFF" />
      <rect x="0" y="0" width="22" height="60" fill="#D52B1E" />
      <rect x="68" y="0" width="22" height="60" fill="#D52B1E" />
      <polygon points="45,16 47,24 55,22 50,28 54,34 46,32 45,42 44,32 36,34 40,28 35,22 43,24" fill="#D52B1E" />
    </>
  );
}

/** Green hoist (2/5), red field, with a simplified armillary/shield emblem on the divide. */
function Portugal() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#DA020E" />
      <rect x="0" y="0" width="36" height="60" fill="#046A38" />
      <circle cx="36" cy="30" r="8" fill="none" stroke="#FFD100" strokeWidth="2" />
      <rect x="32.5" y="26" width="7" height="8" rx="1" fill="#FFFFFF" stroke="#DA020E" strokeWidth="1" />
    </>
  );
}

/** Horizontal black-red-gold tricolour. */
function Germany() {
  return (
    <>
      <rect x="0" y="0" width="90" height="20" fill="#000000" />
      <rect x="0" y="20" width="90" height="20" fill="#DD0000" />
      <rect x="0" y="40" width="90" height="20" fill="#FFCE00" />
    </>
  );
}

/** Red-white-blue horizontal with a chequy shield hint. */
function Croatia() {
  return (
    <>
      <rect x="0" y="0" width="90" height="20" fill="#FF0000" />
      <rect x="0" y="20" width="90" height="20" fill="#FFFFFF" />
      <rect x="0" y="40" width="90" height="20" fill="#171796" />
      <rect x="39" y="20" width="12" height="12" fill="#FFFFFF" stroke="#171796" strokeWidth="0.6" />
      <rect x="39" y="20" width="6" height="6" fill="#FF0000" />
      <rect x="45" y="26" width="6" height="6" fill="#FF0000" />
    </>
  );
}

/** Red field with a green pentagram. */
function Morocco() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#C1272D" />
      <polygon
        points="45,21 47.35,27.76 54.51,27.91 48.8,32.24 50.88,39.09 45,35 39.12,39.09 41.2,32.24 35.49,27.91 42.65,27.76"
        fill="none"
        stroke="#006233"
        strokeWidth="2"
      />
    </>
  );
}

/** White field with a centered red sun disc (Hinomaru). */
function Japan() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#FFFFFF" />
      <circle cx="45" cy="30" r="14" fill="#BC002D" />
    </>
  );
}

/** Simplified Stars and Stripes: red stripes over white with a blue canton. */
function Usa() {
  const stripes = Array.from({ length: 6 }, (_, i) => (
    <rect key={i} x="0" y={4.6 + i * 9.2} width="90" height="4.6" fill="#B22234" />
  ));
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#FFFFFF" />
      {stripes}
      <rect x="0" y="0" width="40" height="32.2" fill="#3C3B6E" />
    </>
  );
}

/** Vertical green-white-red with a central emblem hint. */
function Mexico() {
  return (
    <>
      <rect x="0" y="0" width="30" height="60" fill="#006847" />
      <rect x="30" y="0" width="30" height="60" fill="#FFFFFF" />
      <rect x="60" y="0" width="30" height="60" fill="#CE1126" />
      <circle cx="45" cy="30" r="4" fill="none" stroke="#5E3200" strokeWidth="1.4" />
    </>
  );
}

/** Nine white/blue stripes with a white canton bearing the Sol de Mayo. */
function Uruguay() {
  const stripes = [1, 3, 5, 7].map((i) => (
    <rect key={i} x="0" y={i * 6.67} width="90" height="6.67" fill="#0038A8" />
  ));
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#FFFFFF" />
      {stripes}
      <rect x="0" y="0" width="30" height="26.67" fill="#FFFFFF" />
      <circle cx="15" cy="13" r="5" fill="#FCD116" stroke="#8A6D00" strokeWidth="0.8" />
    </>
  );
}

/** Yellow (top half), blue and red quarters. */
function Colombia() {
  return (
    <>
      <rect x="0" y="0" width="90" height="30" fill="#FCD116" />
      <rect x="0" y="30" width="90" height="15" fill="#003893" />
      <rect x="0" y="45" width="90" height="15" fill="#CE1126" />
    </>
  );
}

/** Red field with an off-centre white Nordic cross. */
function Denmark() {
  return (
    <>
      <rect x="0" y="0" width="90" height="60" fill="#C60C30" />
      <rect x="24" y="0" width="10" height="60" fill="#FFFFFF" />
      <rect x="0" y="25" width="90" height="10" fill="#FFFFFF" />
    </>
  );
}

/** White over red horizontal bicolour. */
function Poland() {
  return (
    <>
      <rect x="0" y="0" width="90" height="30" fill="#FFFFFF" />
      <rect x="0" y="30" width="90" height="30" fill="#DC143C" />
    </>
  );
}

const FLAG_BODY: Record<Exclude<FlagId, ''>, () => ReactElement> = {
  france: France,
  spain: Spain,
  brazil: Brazil,
  argentina: Argentina,
  netherlands: Netherlands,
  england: England,
  norway: Norway,
  switzerland: Switzerland,
  canada: Canada,
  belgium: Belgium,
  portugal: Portugal,
  germany: Germany,
  croatia: Croatia,
  morocco: Morocco,
  japan: Japan,
  usa: Usa,
  mexico: Mexico,
  uruguay: Uruguay,
  colombia: Colombia,
  denmark: Denmark,
  poland: Poland,
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
