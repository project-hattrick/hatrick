import { create } from 'zustand';
import type { ReplayCatalogItem } from '@/services/replay.service';

/** Stream paces accepted by the backend replayer (multiples of real time). */
export const REPLAY_SPEEDS = [2, 4, 6, 8];

interface ReplaySessionStore {
  /** The fixture currently streaming back through `POST /replay` (null while live/mock). */
  source: ReplayCatalogItem | null;
  /** Requested stream pace — applied when a stream (re)starts, like the sandbox picker. */
  speed: number;
  setSource: (source: ReplayCatalogItem | null) => void;
  /** Advance to the next pace and return it — the caller restarts the stream at the new speed. */
  cycleSpeed: () => number;
}

/**
 * Backend-driven replay session (same model as the sandbox arenas): the match streams back through
 * the live pipeline, so there is no client-side playhead — "rewind" means restarting the stream from
 * kickoff, and speed only takes effect when a stream (re)starts.
 */
export const useReplaySessionStore = create<ReplaySessionStore>((set, get) => ({
  source: null,
  speed: 6,
  setSource: (source) => set({ source }),
  cycleSpeed: () => {
    const next = REPLAY_SPEEDS[(REPLAY_SPEEDS.indexOf(get().speed) + 1) % REPLAY_SPEEDS.length];
    set({ speed: next });
    return next;
  },
}));
