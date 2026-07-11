'use client';

import { estimateMinute } from '@/lib/match-clock';
import { useDisplayMatch, useIsInPlay } from '@/store/match.store';
import { useNowSec } from './use-now-sec';

/**
 * The match minute to display: the store minute (event-driven, monotonic) kept ticking by a
 * wall-clock estimate from kickoff, so the clock never freezes between sparse wire events
 * (or when the feed drops). Replays and finished matches return the plain store minute —
 * their clocks are the stream's business.
 */
export function useLiveMinute(): number {
  const match = useDisplayMatch();
  const inPlay = useIsInPlay();
  const nowSec = useNowSec();

  if (!inPlay || match.startTime == null) return match.minute;
  return Math.max(match.minute, estimateMinute(nowSec * 1000 - match.startTime));
}
