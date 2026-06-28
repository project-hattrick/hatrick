import { EmissionState } from '../enums/emission-state.enum';
import { MatchAction } from '../enums/match-action.enum';

/** Normalized match event payload broadcast on the bus and to the frontend. */
export interface MatchEventPayload {
  fixtureId: number;
  action: MatchAction;
  state: EmissionState;
  confirmed: boolean;
  seq: number;
  ts: number;
  minute?: number;
  playerId?: number;
  participant?: number;
}
