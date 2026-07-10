import { MatchAction } from '@/enums/match-action.enum';
import { EmissionState } from '@/enums/emission-state.enum';
import type { FixtureAction } from '@/services/replay.service';
import type { MatchEventPayload } from '@/types/match';

/** Raw TxLINE action string → the front's MatchAction enum. */
const RAW_TO_ACTION: Record<string, MatchAction> = {
  goal: MatchAction.Goal,
  yellow_card: MatchAction.YellowCard,
  red_card: MatchAction.RedCard,
  corner: MatchAction.Corner,
  penalty: MatchAction.Penalty,
  substitution: MatchAction.Substitution,
  free_kick: MatchAction.FreeKick,
};

/** Turn snapshot actions into authoritative (`after`) events the store/recap feed can render. */
export function toMatchEvents(fixtureId: number, actions: FixtureAction[]): MatchEventPayload[] {
  return actions.map((a, index) => ({
    fixtureId,
    action: RAW_TO_ACTION[a.action] ?? MatchAction.Unknown,
    rawAction: a.action,
    state: EmissionState.After,
    confirmed: true,
    seq: index + 1,
    ts: 0,
    minute: a.minute,
    participant: a.participant,
  }));
}
