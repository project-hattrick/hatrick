/** FIFA 3-letter → ISO 3166-1 alpha-2 (flag-icons) for the national teams used on the landing. */
const FIFA_TO_ISO: Record<string, string> = {
  ARG: 'ar',
  BRA: 'br',
  FRA: 'fr',
  GER: 'de',
  ENG: 'gb-eng',
  ESP: 'es',
  POR: 'pt',
  POL: 'pl',
  MEX: 'mx',
  SWE: 'se',
  BEL: 'be',
  SUI: 'ch',
  SRB: 'rs',
  CMR: 'cm',
  KSA: 'sa',
  DEN: 'dk',
  AUS: 'au',
  JPN: 'jp',
  MAR: 'ma',
  ITA: 'it',
  NED: 'nl',
  GBR: 'gb',
  USA: 'us',
  NOR: 'no',
  CRO: 'hr',
};

/** Map a FIFA/short code to an ISO alpha-2; falls back to a lowercased 2-letter code. */
export function fifaToIso(code: string): string {
  return FIFA_TO_ISO[code.toUpperCase()] ?? code.slice(0, 2).toLowerCase();
}
