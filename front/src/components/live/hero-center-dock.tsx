'use client';

import { useIsMatchLive } from '@/store/match.store';
import { PredictionPrompt } from './prediction-prompt';

/**
 * Hero centre bottom dock: the live bet dock while a match is in play. When the match is over you
 * can't bet, so nothing renders here — the centre shows the replay control and the events live in the
 * bottom timeline instead.
 */
export function HeroCenterDock({ variant }: { variant?: 'dock' | 'card' }) {
  const isLive = useIsMatchLive();
  return isLive ? <PredictionPrompt variant={variant} /> : null;
}
