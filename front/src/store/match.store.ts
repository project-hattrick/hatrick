import { create } from 'zustand';
import { MatchAction } from '@/enums/match-action.enum';
import { GameState } from '@/enums/game-state.enum';
import { recapMatch, recapEvents } from '@/config/recap-match.config';
import type { LiveMatch, MatchEventPayload, MatchScore } from '@/types/match';

interface MatchStore {
  match: LiveMatch | null;
  events: MatchEventPayload[];
  /** True while a picked past match is streaming back through the pipeline rather than live. */
  isReplay: boolean;
  /** Bumped on every beginReplay so the hero driver resets even when the same fixture restarts. */
  replayNonce: number;
  /** True from picking a match until its first event lands — the backend replay buffers (~20-30s). */
  switching: boolean;
  setSwitching: (switching: boolean) => void;
  setMatch: (match: LiveMatch) => void;
  /** Switch to a freshly-picked match: set it and drop any prior events (clean slate for a new feed/replay). */
  startMatch: (match: LiveMatch) => void;
  /** Begin a front-driven replay of a finished match (marks isReplay). */
  beginReplay: (match: LiveMatch) => void;
  /** Push one playback frame (score + minute + events up to the cursor) — ignored if a different match is on. */
  setReplayFrame: (fixtureId: number, score: MatchScore, minute: number, events: MatchEventPayload[]) => void;
  /** Set the authoritative score for a fixture (snapshot baseline) — ignored if a different match is on. */
  setScore: (fixtureId: number, score: MatchScore) => void;
  /** Replace the event list for a fixture (snapshot recap) — ignored if a different match is on. */
  setEvents: (fixtureId: number, events: MatchEventPayload[]) => void;
  applyEvent: (event: MatchEventPayload) => void;
}

/**
 * Authoritative score: TxLINE puts the cumulative total on the `Score` object (surfaced as
 * `event.score`), which we must trust rather than counting `goal` actions — a goal is emitted once
 * as during then re-confirmed 2× as after, and can be reversed (docs/txline-provider.md). We take the
 * latest event (highest seq) that carries a score; feeds without one (the mock) fall back to counting.
 */
function resolveScore(events: MatchEventPayload[], fallback: MatchScore): MatchScore {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const s = events[i].score;
    if (s && (typeof s.home === 'number' || typeof s.away === 'number')) {
      return { home: s.home ?? 0, away: s.away ?? 0 };
    }
  }
  const goals = events.filter((event) => event.action === MatchAction.Goal);
  if (goals.length === 0) return fallback;
  return {
    home: goals.filter((goal) => goal.participant === 1).length,
    away: goals.filter((goal) => goal.participant === 2).length,
  };
}

/** during is optimistic, after is authoritative — same seq supersedes. */
function reconcile(events: MatchEventPayload[], incoming: MatchEventPayload): MatchEventPayload[] {
  const others = events.filter((event) => event.seq !== incoming.seq);
  return [...others, incoming].sort((a, b) => a.seq - b.seq).slice(-100);
}

/** Live match state fed by the realtime socket or the mock feed. */
export const useMatchStore = create<MatchStore>((set) => ({
  match: null,
  events: [],
  isReplay: false,
  replayNonce: 0,
  switching: false,
  setSwitching: (switching) => set({ switching }),
  setMatch: (match) => set({ match, isReplay: false }),
  startMatch: (match) => set({ match, events: [], isReplay: false, switching: false }),
  beginReplay: (match) =>
    set((state) => ({ match, events: [], isReplay: true, switching: true, replayNonce: state.replayNonce + 1 })),
  setReplayFrame: (fixtureId, score, minute, events) =>
    set((state) =>
      state.match && state.match.fixtureId === fixtureId
        ? { match: { ...state.match, score, minute }, events }
        : {},
    ),
  setScore: (fixtureId, score) =>
    set((state) =>
      state.match && state.match.fixtureId === fixtureId ? { match: { ...state.match, score } } : {},
    ),
  setEvents: (fixtureId, events) =>
    set((state) => (state.match && state.match.fixtureId === fixtureId ? { events } : {})),
  applyEvent: (event) =>
    set((state) => {
      // Ignore events for a different fixture than the one on screen — a superseded/stale replay must not
      // bleed its score/minute onto the current match.
      if (state.match && event.fixtureId !== state.match.fixtureId) return {};
      const events = reconcile(state.events, event);
      if (!state.match) return { events };
      // Minute is monotonic within a match (during/after or out-of-order frames never rewind the clock);
      // a freshly picked match resets it via startMatch/beginReplay.
      const minute = Math.max(state.match.minute, event.minute ?? state.match.minute);
      // The first real event means the replay is streaming — clear the "switching/buffering" state.
      return { events, switching: false, match: { ...state.match, score: resolveScore(events, state.match.score), minute } };
    }),
}));

export const useMatch = () => useMatchStore((state) => state.match);
export const useMatchEvents = () => useMatchStore((state) => state.events);

/** True only while a match is actually in play — a null (recap) or full-time match reads as ended. */
export const useIsMatchLive = () =>
  useMatchStore((state) => state.match !== null && state.match.gameState !== GameState.FullTime);

/** True while a picked past match is playing back. */
export const useIsReplay = () => useMatchStore((state) => state.isReplay);

/** True while a freshly-picked match is still buffering (no events yet) — drives the "switching" overlay. */
export const useIsSwitching = () => useMatchStore((state) => state.switching);

/** The match to render — the live one when present, otherwise the finished recap fallback. */
export const useDisplayMatch = () => useMatchStore((state) => state.match ?? recapMatch);

/** Events to render — live events when a match is on, otherwise the recap goals. */
export const useDisplayEvents = () =>
  useMatchStore((state) => (state.match ? state.events : recapEvents));
