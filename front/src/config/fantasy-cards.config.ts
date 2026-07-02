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
  /** Country flag colors, used as holographic refraction tint. */
  holoColors: [string, string, string];
  /** Pixel-art portrait in /public/cards. */
  portraitSrc: string;
}

export const userCards: PlayerCardData[] = [
  { id: 'haaland', name: 'Haaland', rating: 96, position: 'ST', flag: '🇳🇴', holoColors: ['#ba0c2f', '#ffffff', '#00205b'], portraitSrc: '/cards/player-93.png', stats: { pac: 94, sho: 96, pas: 88, dri: 80, def: 45, phy: 94 } },
  { id: 'mbappe', name: 'Mbappé', rating: 97, position: 'ST', flag: '🇫🇷', holoColors: ['#0055a4', '#ffffff', '#ef4135'], portraitSrc: '/cards/player-green.png', stats: { pac: 99, sho: 94, pas: 85, dri: 95, def: 40, phy: 82 } },
  { id: 'messi', name: 'Messi', rating: 95, position: 'RW', flag: '🇦🇷', holoColors: ['#74acdf', '#ffffff', '#f6b40e'], portraitSrc: '/cards/player-keeper.png', stats: { pac: 88, sho: 92, pas: 94, dri: 96, def: 38, phy: 70 } },
  { id: 'bellingham', name: 'Bellingham', rating: 92, position: 'CM', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', holoColors: ['#ce1124', '#ffffff', '#ce1124'], portraitSrc: '/cards/player-green.png', stats: { pac: 84, sho: 86, pas: 88, dri: 90, def: 78, phy: 86 } },
  { id: 'vini', name: 'Vini Jr', rating: 94, position: 'LW', flag: '🇧🇷', holoColors: ['#009739', '#fedd00', '#012169'], portraitSrc: '/cards/player-93.png', stats: { pac: 97, sho: 88, pas: 82, dri: 95, def: 34, phy: 76 } },
];

export const statOrder: Array<[string, keyof PlayerStats]> = [
  ['PAC', 'pac'],
  ['DRI', 'dri'],
  ['SHO', 'sho'],
  ['DEF', 'def'],
  ['PAS', 'pas'],
  ['PHY', 'phy'],
];
