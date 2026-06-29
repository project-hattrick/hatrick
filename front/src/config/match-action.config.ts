import { MatchAction } from '@/enums/match-action.enum';

interface MatchActionMeta {
  label: string;
  dotClass: string;
}

export const matchActionConfig: Record<MatchAction, MatchActionMeta> = {
  [MatchAction.Goal]: { label: 'Goal', dotClass: 'bg-neon' },
  [MatchAction.YellowCard]: { label: 'Yellow Card', dotClass: 'bg-chart-4' },
  [MatchAction.RedCard]: { label: 'Red Card', dotClass: 'bg-live' },
  [MatchAction.Substitution]: { label: 'Substitution', dotClass: 'bg-muted-foreground' },
  [MatchAction.Corner]: { label: 'Corner', dotClass: 'bg-team-home' },
  [MatchAction.FreeKick]: { label: 'Free Kick', dotClass: 'bg-muted-foreground' },
  [MatchAction.Penalty]: { label: 'Penalty', dotClass: 'bg-neon' },
  [MatchAction.Var]: { label: 'VAR', dotClass: 'bg-muted-foreground' },
  [MatchAction.Possession]: { label: 'Possession', dotClass: 'bg-muted-foreground' },
  [MatchAction.Unknown]: { label: 'Event', dotClass: 'bg-muted-foreground' },
};

export const matchActionFallback: MatchActionMeta = matchActionConfig[MatchAction.Unknown];
