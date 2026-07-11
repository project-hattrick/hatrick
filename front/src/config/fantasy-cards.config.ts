export interface PlayerStats {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export interface PlayerCardData {
  id: string;
  name: string;
  rating: number;
  position: string;
  stats: PlayerStats;
  /** Country flag emoji. */
  flag: string;
  /** ISO 3166-1 alpha-2 for flag-icons. */
  code: string;
  /** Country flag colors, used as holographic refraction tint. */
  holoColors: [string, string, string];
  /** Pixel-art portrait in /public/cards. */
  portraitSrc: string;
}

// Licensing-safe demo cards (generic names) — a fallback only; real owned cards come from the store.
export const userCards: PlayerCardData[] = [
  { id: 'haaland', name: 'R. Duarte', rating: 96, position: 'ST', flag: '🇳🇴', code: 'no', holoColors: ['#ba0c2f', '#ffffff', '#00205b'], portraitSrc: '/cards/player-93.png', stats: { pac: 94, sho: 96, pas: 88, dri: 80, def: 45, phy: 94 } },
  { id: 'mbappe', name: 'K. Mensah', rating: 97, position: 'ST', flag: '🇫🇷', code: 'fr', holoColors: ['#0055a4', '#ffffff', '#ef4135'], portraitSrc: '/cards/player-green.png', stats: { pac: 99, sho: 94, pas: 85, dri: 95, def: 40, phy: 82 } },
  { id: 'messi', name: 'J. Navarro', rating: 95, position: 'RW', flag: '🇦🇷', code: 'ar', holoColors: ['#74acdf', '#ffffff', '#f6b40e'], portraitSrc: '/cards/player-keeper.png', stats: { pac: 88, sho: 92, pas: 94, dri: 96, def: 38, phy: 70 } },
  { id: 'bellingham', name: 'S. Petrov', rating: 92, position: 'CM', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'gb-eng', holoColors: ['#ce1124', '#ffffff', '#ce1124'], portraitSrc: '/cards/player-green.png', stats: { pac: 84, sho: 86, pas: 88, dri: 90, def: 78, phy: 86 } },
  { id: 'vini', name: 'L. Moreau', rating: 94, position: 'LW', flag: '🇧🇷', code: 'br', holoColors: ['#009739', '#fedd00', '#012169'], portraitSrc: '/cards/player-93.png', stats: { pac: 97, sho: 88, pas: 82, dri: 95, def: 34, phy: 76 } },
];

export const statOrder: Array<[string, keyof PlayerStats]> = [
  ['PAC', 'pac'],
  ['DRI', 'dri'],
  ['SHO', 'sho'],
  ['DEF', 'def'],
  ['PAS', 'pas'],
  ['PHY', 'phy'],
];
