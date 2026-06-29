import { MarketType } from '@/enums/market-type.enum';

interface MarketTypeMeta {
  label: string;
}

export const marketTypeConfig: Record<MarketType, MarketTypeMeta> = {
  [MarketType.MatchResult]: { label: 'Match Result' },
  [MarketType.NextGoal]: { label: 'Next Goal' },
  [MarketType.TotalGoals]: { label: 'Total Goals' },
  [MarketType.PlayerToScore]: { label: 'Player to Score' },
  [MarketType.Corners]: { label: 'Corners' },
  [MarketType.Cards]: { label: 'Cards' },
};

export const marketTypeFallback: MarketTypeMeta = { label: 'Market' };
