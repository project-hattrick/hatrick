import { create } from 'zustand';
import { MatchAction } from '@/enums/match-action.enum';
import { GameState } from '@/enums/game-state.enum';
import { recapMatch, recapEvents } from '@/config/recap-match.config';
import type { LiveMatch, MatchEndPayload, MatchEventPayload, MatchScore } from '@/types/match';

/** One home/away counter pair. */
export interface StatTally {
  home: number;
  away: number;
}

/** Real per-team counts accumulated from the feed (uncapped — survives the 100-event window). */
export interface LiveMatchStats {
  shots: StatTally;
  shotsOnTarget: StatTally;
  fouls: StatTally;
  corners: StatTally;
  yellowCards: StatTally;
  redCards: StatTally;
  offsides: StatTally;
  /** Possession-family event counts — a share proxy, not seconds on the ball. */
  possessionEvents: StatTally;
}

const emptyTally = (): StatTally => ({ home: 0, away: 0 });
export const emptyMatchStats = (): LiveMatchStats => ({
  shots: emptyTally(),
  shotsOnTarget: emptyTally(),
  fouls: emptyTally(),
  corners: emptyTally(),
  yellowCards: emptyTally(),
  redCards: emptyTally(),
  offsides: emptyTally(),
  possessionEvents: emptyTally(),
});

interface MatchStore {
  match: LiveMatch | null;
  events: MatchEventPayload[];
  /** Feed-derived stat totals for the current match (reset whenever the match switches). */
  stats: LiveMatchStats;
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
  finishMatch: (payload: MatchEndPayload) => void;
  applyEvent: (event: MatchEventPayload) => void;
  /** Kickoff reached with no event yet — flip pre-match to in-play so the UI reads live. */
  markLive: (fixtureId: number) => void;
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

/** Seqs already tallied into `stats` — a during/after pair must count once, not twice. */
const talliedSeqs = new Set<number>();

/** Fold one event into the stat totals; null when it carries nothing countable. */
function tallyEvent(stats: LiveMatchStats, event: MatchEventPayload): LiveMatchStats | null {
  const { participant } = event;
  if (participant !== 1 && participant !== 2) return null;
  const raw = (event.rawAction ?? '').toLowerCase();
  const next = { ...stats };
  let counted = false;
  const add = (key: keyof LiveMatchStats) => {
    const tally = next[key];
    next[key] = participant === 1 ? { ...tally, home: tally.home + 1 } : { ...tally, away: tally.away + 1 };
    counted = true;
  };

  // A goal is by definition a shot on target; the wire classifies the moment once, not twice.
  if (event.action === MatchAction.Goal || raw === 'shot_on_target') {
    add('shots');
    add('shotsOnTarget');
  } else if (raw === 'shot' || raw === 'shot_off_target' || raw === 'shot_blocked') {
    add('shots');
  }
  if (event.action === MatchAction.YellowCard) add('yellowCards');
  if (event.action === MatchAction.RedCard) add('redCards');
  if (event.action === MatchAction.Corner) add('corners');
  if (raw.includes('foul')) add('fouls');
  if (raw.includes('offside')) add('offsides');
  if (event.possessionType || raw.includes('possession')) add('possessionEvents');
  return counted ? next : null;
}

/** Rebuild the totals from a full event list (front-driven replay frames replace the list wholesale). */
function tallyAll(events: MatchEventPayload[]): LiveMatchStats {
  talliedSeqs.clear();
  let stats = emptyMatchStats();
  for (const event of events) {
    const next = tallyEvent(stats, event);
    if (next) {
      stats = next;
      talliedSeqs.add(event.seq);
    }
  }
  return stats;
}

/** Fresh stats for a fresh match — clears the tallied-seq guard alongside. */
function resetStats(): LiveMatchStats {
  talliedSeqs.clear();
  return emptyMatchStats();
}

/** Live match state fed by the realtime socket or the mock feed. */
export const useMatchStore = create<MatchStore>((set) => ({
  match: null,
  events: [],
  stats: emptyMatchStats(),
  isReplay: false,
  replayNonce: 0,
  switching: false,
  setSwitching: (switching) => set({ switching }),
  setMatch: (match) => set({ match, isReplay: false, stats: resetStats() }),
  startMatch: (match) => set({ match, events: [], isReplay: false, switching: false, stats: resetStats() }),
  beginReplay: (match) =>
    set((state) => ({
      match,
      events: [],
      isReplay: true,
      switching: true,
      replayNonce: state.replayNonce + 1,
      stats: resetStats(),
    })),
  setReplayFrame: (fixtureId, score, minute, events) =>
    set((state) =>
      state.match && state.match.fixtureId === fixtureId
        ? { match: { ...state.match, score, minute }, events, stats: tallyAll(events) }
        : {},
    ),
  setScore: (fixtureId, score) =>
    set((state) =>
      state.match && state.match.fixtureId === fixtureId ? { match: { ...state.match, score } } : {},
    ),
  setEvents: (fixtureId, events) =>
    set((state) => (state.match && state.match.fixtureId === fixtureId ? { events } : {})),
  markLive: (fixtureId) =>
    set((state) =>
      state.match && state.match.fixtureId === fixtureId && state.match.gameState === GameState.PreMatch
        ? { match: { ...state.match, gameState: GameState.FirstHalf } }
        : {},
    ),
  finishMatch: (payload) =>
    set((state) => {
      if (!state.match || state.match.fixtureId !== payload.fixtureId) return {};
      return {
        switching: false,
        match: {
          ...state.match,
          gameState: GameState.FullTime,
          minute: Math.max(state.match.minute, 90),
          score: {
            home: payload.homeScore ?? state.match.score.home,
            away: payload.awayScore ?? state.match.score.away,
          },
        },
      };
    }),
  applyEvent: (event) =>
    set((state) => {
      // Ignore events for a different fixture than the one on screen — a superseded/stale replay must not
      // bleed its score/minute onto the current match.
      if (state.match && event.fixtureId !== state.match.fixtureId) return {};
      const events = reconcile(state.events, event);
      if (!state.match) return { events };
      // Feed stats: count each seq once (a during/after pair supersedes, it doesn't repeat).
      let stats = state.stats;
      if (!talliedSeqs.has(event.seq)) {
        const tallied = tallyEvent(state.stats, event);
        if (tallied) {
          talliedSeqs.add(event.seq);
          stats = tallied;
        }
      }
      // Minute is monotonic within a match (during/after or out-of-order frames never rewind the clock);
      // a freshly picked match resets it via startMatch/beginReplay.
      const minute = Math.max(state.match.minute, event.minute ?? state.match.minute);
      // Match structure from the wire: pre-match ends at the first event; the half-time whistle pauses
      // the match (drives the pause overlay); the second-half kickoff (or any 46'+ event) resumes it.
      const raw = (event.rawAction ?? '').toLowerCase();
      let gameState =
        state.match.gameState === GameState.PreMatch ? GameState.FirstHalf : state.match.gameState;
      if (raw === 'halftime_finalised') gameState = GameState.HalfTime;
      else if (raw === 'game_finalised') gameState = GameState.FullTime;
      // Observed end-of-coverage sequence: game_finalised → disconnected (97'). A late disconnect is a
      // full-time fallback in case the whistle frame was missed; an early one is just a coverage blip.
      else if (raw === 'disconnected' && minute >= 90) gameState = GameState.FullTime;
      else if (gameState === GameState.HalfTime && (raw === 'kickoff' || (event.minute ?? 0) > 45))
        gameState = GameState.SecondHalf;
      // The first real event means the replay is streaming — clear the "switching/buffering" state.
      return {
        events,
        stats,
        switching: false,
        match: { ...state.match, score: resolveScore(events, state.match.score), minute, gameState },
      };
    }),
}));

export const useMatch = () => useMatchStore((state) => state.match);
export const useMatchEvents = () => useMatchStore((state) => state.events);

/** Feed-derived stat totals for the current match (zeros until events land). */
export const useMatchStats = () => useMatchStore((state) => state.stats);

/** True once the current match has real feed events to count stats from. */
export const useHasFeedStats = () =>
  useMatchStore((state) => state.match !== null && state.events.length > 0);

export const isMatchBettable = (match: LiveMatch | null) =>
  match !== null && match.gameState !== GameState.FullTime;

/** True only while a match is actually in play — a null (recap) or full-time match reads as ended. */
export const useIsMatchLive = () => useMatchStore((state) => isMatchBettable(state.match));

/** True while a picked past match is playing back. */
export const useIsReplay = () => useMatchStore((state) => state.isReplay);

/** True while the current match hasn't kicked off yet (pre-match countdown showing). */
export const useIsUpcoming = () =>
  useMatchStore((state) => state.match?.gameState === GameState.PreMatch);

/** Game states where the ball is (meant to be) rolling — not pre-match, HT, or FT. */
export const IN_PLAY_STATES: ReadonlySet<GameState> = new Set([
  GameState.FirstHalf,
  GameState.SecondHalf,
  GameState.ExtraTime,
]);

/** True while a real (non-replay) match is actually in play right now. */
export const useIsInPlay = () =>
  useMatchStore(
    (state) => state.match !== null && !state.isReplay && IN_PLAY_STATES.has(state.match.gameState),
  );

/** True once a real (non-replay) match reached full-time — drives the locked winner screen. */
export const useIsEnded = () =>
  useMatchStore(
    (state) => state.match !== null && !state.isReplay && state.match.gameState === GameState.FullTime,
  );

/** True while a freshly-picked match is still buffering (no events yet) — drives the "switching" overlay. */
export const useIsSwitching = () => useMatchStore((state) => state.switching);

/** The match to render — the live one when present, otherwise the finished recap fallback. */
export const useDisplayMatch = () => useMatchStore((state) => state.match ?? recapMatch);

/** Events to render — live events when a match is on, otherwise the recap goals. */
export const useDisplayEvents = () =>
  useMatchStore((state) => (state.match ? state.events : recapEvents));
