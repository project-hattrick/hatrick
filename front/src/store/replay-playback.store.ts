import { create } from 'zustand';
import type { FixtureTimeline } from '@/services/replay.service';

export const REPLAY_SPEEDS = [1, 2, 4, 8];
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

interface ReplayPlaybackStore {
  timeline: FixtureTimeline | null;
  /** Playhead in match minutes. */
  cursor: number;
  playing: boolean;
  speed: number;
  /** Start playing a fixture timeline from kickoff. */
  load: (timeline: FixtureTimeline) => void;
  /** Advance the playhead (called by the tick loop). */
  tick: (deltaMin: number) => void;
  /** Seek (drag). */
  setCursor: (minute: number) => void;
  toggle: () => void;
  cycleSpeed: () => void;
  restart: () => void;
  clear: () => void;
}

/** Front-driven playback of a finished match's timeline — seekable, no live stream needed. */
export const useReplayPlaybackStore = create<ReplayPlaybackStore>((set) => ({
  timeline: null,
  cursor: 0,
  playing: false,
  speed: 2,
  load: (timeline) => set({ timeline, cursor: 0, playing: true }),
  tick: (deltaMin) =>
    set((state) => {
      if (!state.playing || !state.timeline) return {};
      const next = state.cursor + deltaMin;
      if (next >= state.timeline.durationMin) return { cursor: state.timeline.durationMin, playing: false };
      return { cursor: next };
    }),
  setCursor: (minute) =>
    set((state) => ({ cursor: clamp(minute, 0, state.timeline?.durationMin ?? 95) })),
  toggle: () => set((state) => ({ playing: !state.playing && !!state.timeline })),
  cycleSpeed: () =>
    set((state) => ({ speed: REPLAY_SPEEDS[(REPLAY_SPEEDS.indexOf(state.speed) + 1) % REPLAY_SPEEDS.length] })),
  restart: () => set((state) => (state.timeline ? { cursor: 0, playing: true } : {})),
  clear: () => set({ timeline: null, cursor: 0, playing: false }),
}));
