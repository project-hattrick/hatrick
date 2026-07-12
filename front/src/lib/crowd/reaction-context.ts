import { TeamSide } from '@/enums/team-side.enum';
import type { LiveMatch, MatchEventPayload } from '@/types/match';
import type { ReactionContext } from '@/config/crowd-reactions.config';

/** The event protagonist's side (participant 1 = home, 2 = away, default home). */
export function eventSide(event: MatchEventPayload): TeamSide {
  return event.participant === 2 ? TeamSide.Away : TeamSide.Home;
}

/** Snapshot the match state around an event for the message templates. */
export function buildReactionContext(match: LiveMatch, event?: MatchEventPayload): ReactionContext {
  const side = event ? eventSide(event) : TeamSide.Home;
  const team = side === TeamSide.Away ? match.away : match.home;
  const other = side === TeamSide.Away ? match.home : match.away;
  return {
    teamCode: team.code,
    teamName: team.name,
    otherCode: other.code,
    otherName: other.name,
    homeScore: match.score.home,
    awayScore: match.score.away,
    minute: event?.minute ?? match.minute,
    scoreline: `${match.home.code} ${match.score.home}-${match.score.away} ${match.away.code}`,
    playerLabel: event?.label,
    outcome: event?.outcome,
    varType: event?.varType,
  };
}
