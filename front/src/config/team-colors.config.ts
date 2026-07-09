/**
 * A primary brand colour per national team for match-card accents (e.g. the "next game" beams), keyed by
 * flag-icons ISO code (lowercase). Uncurated teams get a stable colour derived from the code so a given
 * team always paints the same.
 */
const TEAM_COLORS: Record<string, string> = {
  ar: '#75AADB', // Argentina — celeste
  br: '#009B3A', // Brazil — green
  fr: '#0055A4', // France — blue
  es: '#AA151B', // Spain — red
  pt: '#DA291C', // Portugal — red
  ch: '#D52B1E', // Switzerland — red
  co: '#FCD116', // Colombia — yellow
  no: '#BA0C2F', // Norway — red
  ca: '#D80621', // Canada — red
  ma: '#C1272D', // Morocco — red
  be: '#E30613', // Belgium — red
  mx: '#006847', // Mexico — green
  de: '#DD0000', // Germany — red
  nl: '#EC5800', // Netherlands — orange
  it: '#0066CC', // Italy — azzurro
  hr: '#C8102E', // Croatia — red
  uy: '#5CBFEB', // Uruguay — celeste
  jp: '#14267B', // Japan — blue
  dk: '#C8102E', // Denmark — red
  pl: '#DC143C', // Poland — crimson
  au: '#00843D', // Australia — green
  rs: '#C6363C', // Serbia — red
  cm: '#007A5E', // Cameroon — green
  sa: '#006C35', // Saudi Arabia — green
  'gb-eng': '#1D3D8F', // England — blue
};

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Primary brand colour for a team's flag-icons ISO code — curated when known, else a stable hue. */
export function teamColor(iso: string): string {
  const hit = TEAM_COLORS[iso?.toLowerCase()];
  if (hit) return hit;
  return `hsl(${hash(iso ?? '') % 360} 70% 52%)`;
}
