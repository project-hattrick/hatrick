'use client';

import { BetSlip } from '@/components/live/bet-slip';
import { useIsMatchLive, useIsReplay } from '@/store/match.store';

/**
 * The shared bet slip, shown only while the room's match is genuinely bettable — a replay or a
 * finished match already happened, so there's nothing to stake (RoomBetPanel shows the result instead).
 */
export function RoomBetSlip() {
  const isMatchLive = useIsMatchLive();
  const isReplay = useIsReplay();
  if (!isMatchLive || isReplay) return null;
  return <BetSlip />;
}
