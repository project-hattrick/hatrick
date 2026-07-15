import { TeamSide } from '@/enums/team-side.enum';
import { fifaToIso } from '@/lib/country';
import type { TeamInfo } from '@/types/match';

/** Full team name → short code + emoji flag. Codes align with fifaToIso so crests resolve. */
const TEAM_BY_NAME: Record<string, { code: string; flag: string }> = {
  Argentina: { code: 'ARG', flag: '🇦🇷' },
  France: { code: 'FRA', flag: '🇫🇷' },
  Brazil: { code: 'BRA', flag: '🇧🇷' },
  Portugal: { code: 'POR', flag: '🇵🇹' },
  Spain: { code: 'ESP', flag: '🇪🇸' },
  Germany: { code: 'GER', flag: '🇩🇪' },
  England: { code: 'ENG', flag: '🏴' },
  Netherlands: { code: 'NED', flag: '🇳🇱' },
  Italy: { code: 'ITA', flag: '🇮🇹' },
  Belgium: { code: 'BEL', flag: '🇧🇪' },
  Croatia: { code: 'CRO', flag: '🇭🇷' },
  Uruguay: { code: 'URU', flag: '🇺🇾' },
  Mexico: { code: 'MEX', flag: '🇲🇽' },
  Morocco: { code: 'MAR', flag: '🇲🇦' },
  Japan: { code: 'JPN', flag: '🇯🇵' },
  Denmark: { code: 'DEN', flag: '🇩🇰' },
  Poland: { code: 'POL', flag: '🇵🇱' },
  Sweden: { code: 'SWE', flag: '🇸🇪' },
  Australia: { code: 'AUS', flag: '🇦🇺' },
  Switzerland: { code: 'SUI', flag: '🇨🇭' },
  Serbia: { code: 'SRB', flag: '🇷🇸' },
  Cameroon: { code: 'CMR', flag: '🇨🇲' },
  Norway: { code: 'NOR', flag: '🇳🇴' },
  Colombia: { code: 'COL', flag: '🇨🇴' },
  'United States': { code: 'USA', flag: '🇺🇸' },
  USA: { code: 'USA', flag: '🇺🇸' },
  Canada: { code: 'CAN', flag: '🇨🇦' },
  'South Korea': { code: 'KOR', flag: '🇰🇷' },
  'Korea Republic': { code: 'KOR', flag: '🇰🇷' },
  Senegal: { code: 'SEN', flag: '🇸🇳' },
  Ghana: { code: 'GHA', flag: '🇬🇭' },
  Nigeria: { code: 'NGA', flag: '🇳🇬' },
  Ecuador: { code: 'ECU', flag: '🇪🇨' },
  Qatar: { code: 'QAT', flag: '🇶🇦' },
  Iran: { code: 'IRN', flag: '🇮🇷' },
  Tunisia: { code: 'TUN', flag: '🇹🇳' },
  'Ivory Coast': { code: 'CIV', flag: '🇨🇮' },
  Egypt: { code: 'EGY', flag: '🇪🇬' },
  Algeria: { code: 'ALG', flag: '🇩🇿' },
  Wales: { code: 'WAL', flag: '🏴' },
  Scotland: { code: 'SCO', flag: '🏴' },
  'Costa Rica': { code: 'CRC', flag: '🇨🇷' },
  Peru: { code: 'PER', flag: '🇵🇪' },
  Chile: { code: 'CHI', flag: '🇨🇱' },
  Paraguay: { code: 'PAR', flag: '🇵🇾' },
  Turkey: { code: 'TUR', flag: '🇹🇷' },
  Ukraine: { code: 'UKR', flag: '🇺🇦' },
  Austria: { code: 'AUT', flag: '🇦🇹' },
  'Czech Republic': { code: 'CZE', flag: '🇨🇿' },
  Greece: { code: 'GRE', flag: '🇬🇷' },
  Panama: { code: 'PAN', flag: '🇵🇦' },
  'Saudi Arabia': { code: 'KSA', flag: '🇸🇦' },
  'New Zealand': { code: 'NZL', flag: '🇳🇿' },
  'South Africa': { code: 'RSA', flag: '🇿🇦' },
  Vietnam: { code: 'VIE', flag: '🇻🇳' },
  'Viet Nam': { code: 'VIE', flag: '🇻🇳' },
  Myanmar: { code: 'MYA', flag: '🇲🇲' },
};

const TEAM_NAME_ALIAS: Record<string, string> = {
  VIETNAM: 'Vietnam',
  'VIET NAM': 'Viet Nam',
  MYANMAR: 'Myanmar',
};

function teamByName(name: string): { code: string; flag: string } | undefined {
  const trimmed = name.trim();
  return TEAM_BY_NAME[trimmed] ?? TEAM_BY_NAME[TEAM_NAME_ALIAS[trimmed.toUpperCase().replace(/\s+/g, ' ')]];
}

/** Build a TeamInfo from a fixture's participant name — falls back to a derived 3-letter code. */
export function teamInfoFromName(name: string, side: TeamSide): TeamInfo {
  const cleanName = name.trim();
  const known = teamByName(cleanName) ?? { code: cleanName.slice(0, 3).toUpperCase(), flag: '🏳️' };
  return { side, code: known.code, name: cleanName, flag: known.flag };
}

/** Full team name for a FIFA code (reverse lookup), or the code itself when unknown. */
export function teamNameFromCode(code: string): string {
  const upper = code.toUpperCase();
  return Object.keys(TEAM_BY_NAME).find((name) => TEAM_BY_NAME[name].code === upper) ?? upper;
}

/** flag-icons ISO for a recognised country name, or null when the name isn't a known nation. */
export function flagIsoForName(name: string): string | null {
  const known = teamByName(name);
  return known ? fifaToIso(known.code) : null;
}
