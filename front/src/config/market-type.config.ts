import { Flag, Goal, Hash, RectangleVertical, Target, Trophy, type LucideIcon } from 'lucide-react';
import { MarketType } from '@/enums/market-type.enum';
import { Tone } from '@/enums/tone.enum';

interface MarketTypeMeta {
  label: string;
  tone: Tone;
  icon: LucideIcon;
}

/** Each betting market maps to a label, SEMANTIC accent role and a lucide icon (drives MarketIcon + framing). */
export const marketTypeConfig: Record<MarketType, MarketTypeMeta> = {
  [MarketType.MatchResult]: { label: 'Match Result', tone: Tone.Neutral, icon: Trophy },
  [MarketType.NextGoal]: { label: 'Next Goal', tone: Tone.Positive, icon: Goal },
  [MarketType.TotalGoals]: { label: 'Total Goals', tone: Tone.Positive, icon: Hash },
  [MarketType.PlayerToScore]: { label: 'Player to Score', tone: Tone.Positive, icon: Target },
  [MarketType.Corners]: { label: 'Corners', tone: Tone.Info, icon: Flag },
  [MarketType.Cards]: { label: 'Cards', tone: Tone.Warning, icon: RectangleVertical },
};

export const marketTypeFallback: MarketTypeMeta = { label: 'Market', tone: Tone.Neutral, icon: Trophy };
