import { EmissionState } from '../enums/emission-state.enum';
import { MatchAction } from '../enums/match-action.enum';
import { LineupsBySide, PlayerStatsBySide } from '../../txline/txline.types';

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
  /** `Head | Shot | OwnGoal | Other` when the provider qualifies a goal. */
  goalType?: string;
  /** Shot/penalty/VAR result: `OnTarget|OffTarget|Woodwork|Blocked | Scored|Missed|Retake | Stands|Overturned`. */
  outcome?: string;
  /** VAR review subject: `Goal|Penalty|RedCard|SecondYellowCard|CornerKick|MistakenIdentity|Other`. */
  varType?: string;
  /** Free-kick danger tier: `Safe|Attack|Danger|HighDanger|Offside`. */
  freeKickType?: string;
  participant?: number;
  /** Authoritative cumulative score at this event (from the wire `Score` object). */
  score?: { home?: number; away?: number };
  /** Regulation-time (H1+H2) score — standard 1X2/OU settlement basis (Total includes ET). */
  regulationScore?: { home?: number; away?: number };
  /** Per-player cumulative stats keyed by TxLINE player ID — drives Fantasy attribute recalculation. */
  playerStats?: PlayerStatsBySide;
  /** Present only on `action=lineups` events — playerId → shirt/position, no names. */
  lineups?: LineupsBySide;
}
