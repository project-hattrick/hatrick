/**
 * Rating-driven card rarity for store/market displays.
 * Colors mirror the pack-opening rarity treatment (epic purple / legendary gold
 * surfaces) so a card reads the same everywhere it appears.
 */

export const enum CardRarity {
  Legendary = 'legendary',
  Epic = 'epic',
  Rare = 'rare',
  Common = 'common',
}

export interface RarityTheme {
  label: string;
  /** HoloPlayerCard surface gradient — undefined keeps the default dark foil. */
  surfaceColors?: [string, string];
  /** Slow light sweep behind the artwork (legendary only). */
  surfaceShine: boolean;
  /** Quiet rarity label color — plain colored text, no pill. */
  badgeClass: string;
  /** Rarity tint for the wrapping tile border. */
  tileClass: string;
  /** Translucent rarity color for the tile's corner wash + diagonal streaks. */
  tint: string;
}

/** 97+ legendary · 95–96 epic · 93–94 rare · below common. */
export const rarityFor = (rating: number): CardRarity => {
  if (rating >= 97) return CardRarity.Legendary;
  if (rating >= 95) return CardRarity.Epic;
  if (rating >= 93) return CardRarity.Rare;
  return CardRarity.Common;
};

export const RARITY_THEME: Record<CardRarity, RarityTheme> = {
  [CardRarity.Legendary]: {
    label: 'Legendary',
    surfaceColors: ['#242018', '#8c783c'],
    surfaceShine: true,
    badgeClass: 'text-warning',
    tileClass: 'border-warning/40',
    tint: 'rgba(251,191,36,0.13)',
  },
  [CardRarity.Epic]: {
    label: 'Epic',
    surfaceColors: ['#1d1a24', '#4b3d67'],
    surfaceShine: false,
    badgeClass: 'text-[#b58aff]',
    tileClass: 'border-[#b58aff]/35',
    tint: 'rgba(181,138,255,0.13)',
  },
  [CardRarity.Rare]: {
    label: 'Rare',
    surfaceShine: false,
    surfaceColors: ['#171e27', '#2f4d6c'],
    badgeClass: 'text-info',
    tileClass: 'border-info/35',
    tint: 'rgba(91,155,255,0.13)',
  },
  [CardRarity.Common]: {
    label: 'Common',
    surfaceShine: false,
    badgeClass: 'text-muted-foreground',
    tileClass: '',
    tint: 'rgba(255,255,255,0.05)',
  },
};
