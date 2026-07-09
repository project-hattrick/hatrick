import { EmissionState } from '@/enums/emission-state.enum';
import { DrivenPhase } from '@/game/realgk/enums';
import type { MatchEventPayload } from '@/types/match';

/** Wire `Action` strings that carry match structure (see KNOWN_ACTIONS on the api normalizer). */
enum WireAction {
  Kickoff = 'kickoff',
  HalfTime = 'halftime_finalised',
  FullTime = 'game_finalised',
}

/**
 * Engine-agnostic mapping from a live match event onto a game engine's "director" API. Shared by every
 * feed-driven runtime (headsonly, realgk) so the translation stays in lockstep — each engine passes its
 * own director + a participant→team resolver (the engines use different `Team` enums).
 */
export interface MatchDirector<T> {
  /** Authoritative scoreboard (home / participant 1, away / participant 2). */
  setScore: (home: number, away: number) => void;
  /** The team on the ball + how threatening (0..1). */
  setPossession: (team: T, threat: number) => void;
  injectShot: (team: T) => void;
  injectGoal: (team: T) => void;
  injectCorner: (team: T) => void;
  injectCard: (team: T) => void;
  /** Authoritative match minute (optional — only the realgk engine implements a driven clock). */
  setClock?: (minute: number) => void;
  /** Match structure (kickoff / half-time / full-time) — optional; engines opt in per variant. */
  setPhase?: (phase: DrivenPhase) => void;
}

/** possessionType → threat (0..1). */
const THREAT: Record<string, number> = { Safe: 0.15, Attack: 0.5, Danger: 0.75, HighDanger: 0.95 };

/** How threatening this event makes the team's possession (null = don't nudge). */
export function threatOf(possessionType?: string, raw?: string): number | null {
  if (possessionType && possessionType in THREAT) return THREAT[possessionType];
  if (raw && /free_kick|throw_in|goal_kick|kickoff/.test(raw)) return 0.2;
  return null;
}

/**
 * Map one live event onto engine director calls (the "molding"). Discrete actions (goal/shot/corner/card)
 * are gated to one emission state so during+after don't double-fire; continuous flow steers possession.
 * `teamOf` resolves the wire participant (1/2) to the engine's team, or null for a neutral event.
 */
export function driveMatchEvent<T>(
  director: MatchDirector<T>,
  teamOf: (participant?: number) => T | null,
  p: MatchEventPayload,
): void {
  if (p.score) director.setScore(p.score.home ?? 0, p.score.away ?? 0);
  if (typeof p.minute === 'number') director.setClock?.(p.minute);
  const raw = (p.rawAction ?? '').toLowerCase();
  // Match structure first — these are neutral (no participant) and must not fall through the team gate.
  // The engine transitions are idempotent, so during+after copies of the same whistle are safe.
  if (raw === WireAction.HalfTime) return void director.setPhase?.(DrivenPhase.HalfTime);
  if (raw === WireAction.FullTime) return void director.setPhase?.(DrivenPhase.FullTime);
  if (raw === WireAction.Kickoff) director.setPhase?.(DrivenPhase.Kickoff); // also resumes the second half
  const team = teamOf(p.participant);
  if (team == null) return;
  if (raw === 'goal') return void (p.state === EmissionState.After && director.injectGoal(team));
  if (raw === 'shot') return void (p.state === EmissionState.During && director.injectShot(team));
  if (raw === 'corner') return void (p.state === EmissionState.During && director.injectCorner(team));
  if (raw.includes('card')) return void (p.state === EmissionState.After && director.injectCard(team));
  const t = threatOf(p.possessionType, raw);
  if (t != null) director.setPossession(team, t);
}
