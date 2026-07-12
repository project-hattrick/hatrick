import { EmissionState } from '@/enums/emission-state.enum';
import { MatchAction } from '@/enums/match-action.enum';
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
  injectShot: (team: T, outcome?: string) => void;
  injectGoal: (team: T) => void;
  injectCorner: (team: T) => void;
  /** `red` = straight red / second yellow (engines may ignore the flag). */
  injectCard: (team: T, red?: boolean) => void;
  /** Feed-awarded penalty — optional (only the realgk engine stages it). */
  injectPenalty?: (team: T) => void;
  /** Feed-awarded (dangerous) free kick with a wall — optional; `danger` 0..1. */
  injectFreeKick?: (team: T, danger?: number) => void;
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
  // Celebrate on the NORMALIZED action, not the raw string: a converted penalty can arrive as a single
  // `action=penalty` frame carrying the goal flag, which the api's resolveAction normalizes to Goal. Keying
  // on `raw === 'goal'` would bump the score but skip the on-pitch celebration. injectGoal is already gated
  // on a real score increase in driveGuarded, so this never double-fires.
  if (p.action === MatchAction.Goal) return void (p.state === EmissionState.After && director.injectGoal(team));
  if (raw === 'shot') return void (p.state === EmissionState.During && director.injectShot(team, p.outcome));
  if (raw === 'corner') return void (p.state === EmissionState.During && director.injectCorner(team));
  // `red_card` / `second_yellow_card` → red; anything else with "card" → yellow. `varType` from a VAR
  // review (RedCard / SecondYellowCard) is a secondary signal for the colour.
  if (raw.includes('card')) {
    const red = /red_card|second_yellow/.test(raw) || /RedCard|SecondYellowCard/.test(p.varType ?? '');
    return void (p.state === EmissionState.After && director.injectCard(team, red));
  }
  // A penalty AWARD (a scored penalty normalizes to Goal, so `action === Penalty` = awarded/missed, never
  // scored) → stage the spot kick. The outcome still comes from the feed (a following goal event, or a save).
  if (p.action === MatchAction.Penalty) return void (p.state === EmissionState.During && director.injectPenalty?.(team));
  // Free kicks: only DANGEROUS ones (near goal) are worth a wall + stoppage; minor midfield ones just nudge
  // possession, so the room doesn't stop-start on every whistle. Offside is already excluded from FreeKick.
  if (p.action === MatchAction.FreeKick) {
    const fk = p.freeKickType ?? '';
    if (fk === 'Danger' || fk === 'HighDanger') {
      return void (p.state === EmissionState.During && director.injectFreeKick?.(team, THREAT[fk] ?? 0.75));
    }
    return void director.setPossession(team, THREAT[fk] ?? 0.3);
  }
  const t = threatOf(p.possessionType, raw);
  if (t != null) director.setPossession(team, t);
}
