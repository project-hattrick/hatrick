import { EmissionState } from '../enums/emission-state.enum';
import { MatchAction } from '../enums/match-action.enum';

/** Normalized match event payload broadcast on the bus and to the frontend. */
export interface MatchEventPayload {
  fixtureId: number;
  action: MatchAction;
  /** Raw provider action string (e.g. `shot`, `danger_possession`) — richer than the enum. */
  rawAction?: string;
  /** `Safe | Attack | Danger | HighDanger` — drives the 2D danger meter. */
  possessionType?: string;
  state: EmissionState;
  confirmed: boolean;
  seq: number;
  ts: number;
  minute?: number;
  playerId?: number;
  participant?: number;
  /** Authoritative cumulative score at this event (from the wire `Score` object). */
  score?: { home?: number; away?: number };
  /** Per-player stats blob — drives Fantasy attribute recalculation. */
  playerStats?: Record<string, unknown>;
}
