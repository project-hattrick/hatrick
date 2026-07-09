import { MatchAction } from '@/enums/match-action.enum';
import { EmissionState } from '@/enums/emission-state.enum';
import type { FixtureAction, TimelineEvent } from '@/services/replay.service';
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

/** Timeline moments → events, carrying the authoritative cumulative score at each point. */
export function timelineToMatchEvents(fixtureId: number, events: TimelineEvent[]): MatchEventPayload[] {
  return events.map((e, index) => ({
    fixtureId,
    action: RAW_TO_ACTION[e.action] ?? MatchAction.Unknown,
    rawAction: e.action,
    state: EmissionState.After,
    confirmed: true,
    seq: index + 1,
    ts: 0,
    minute: e.minute,
    participant: e.participant,
    score: { home: e.home, away: e.away },
  }));
}
