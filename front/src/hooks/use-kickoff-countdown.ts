'use client';

import { GameState } from '@/enums/game-state.enum';
import { useMatchStore } from '@/store/match.store';
import { useNowSec } from './use-now-sec';

const pad = (value: number) => String(value).padStart(2, '0');

function format(remainingMs: number): string {
  const total = Math.max(0, Math.round(remainingMs / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Ticking time-to-kickoff for the current match — "MM:SS" (or "H:MM:SS"), clamped at "00:00"
 * until the first live event flips the match out of pre-match. Null when the match is already
 * in play/finished or has no known kickoff time.
 */
export function useKickoffCountdown(): string | null {
  const kickoffAt = useMatchStore((state) =>
    state.match?.gameState === GameState.PreMatch ? (state.match.startTime ?? null) : null,
  );
  const nowSec = useNowSec();

  return kickoffAt == null ? null : format(kickoffAt - nowSec * 1000);
}
