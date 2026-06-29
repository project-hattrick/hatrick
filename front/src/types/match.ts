import type { MatchAction } from '@/enums/match-action.enum';
import type { EmissionState } from '@/enums/emission-state.enum';
import type { GameState } from '@/enums/game-state.enum';
import type { TeamSide } from '@/enums/team-side.enum';

/** Wire shape pushed on match-event.during / match-event.after (mirrors the api DTO). */
export interface MatchEventPayload {
  fixtureId: number;
  action: MatchAction;
  state: EmissionState;
  confirmed: boolean;
  seq: number;
  ts: number;
  minute?: number;
  participant?: number;
  label?: string;
}

export interface TeamInfo {
  side: TeamSide;
  code: string;
  name: string;
  flag: string;
}

export interface MatchScore {
  home: number;
  away: number;
}

export interface LiveMatch {
  fixtureId: number;
  home: TeamInfo;
  away: TeamInfo;
  score: MatchScore;
  minute: number;
  gameState: GameState;
}
