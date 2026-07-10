import { MatchAction } from '@/enums/match-action.enum';
import type { MatchEventPayload } from '@/types/match';

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

/** Enum buckets that always deserve a chip (headline moments). */
const NOTABLE_ACTIONS = new Set<MatchAction>([
  MatchAction.Goal,
  MatchAction.YellowCard,
  MatchAction.RedCard,
  MatchAction.Substitution,
  MatchAction.Corner,
  MatchAction.FreeKick,
  MatchAction.Penalty,
  MatchAction.Var,
]);

/** possessionType → user-facing chip (Safe is invisible — it's the between-moments state). */
const POSSESSION_META: Record<string, MatchActionMeta> = {
  HighDanger: { label: 'Big chance', dotClass: 'bg-live' },
  Danger: { label: 'Dangerous attack', dotClass: 'bg-chart-4' },
  Attack: { label: 'Attack', dotClass: 'bg-team-home' },
};

/** Curated labels for raw wire actions the enum doesn't bucket (fallback: humanized snake_case). */
const RAW_ACTION_LABELS: Record<string, string> = {
  game_started: 'Kick-off',
  game_finalised: 'Full-time',
  shot: 'Shot',
  shot_on_target: 'Shot on target',
  shot_off_target: 'Shot off target',
};

/** Raw actions that are pipeline noise, never a user-facing moment. */
const HIDDEN_RAW = new Set(['safe_possession', 'possession', 'clock', 'stats']);

const humanize = (raw: string) => {
  const text = raw.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * User-facing description of a match event, or null when it isn't worth a chip. Never renders the
 * meaningless "Event" bucket: unmapped actions fall back to possession threat, then to a humanized
 * raw wire action, then disappear.
 */
export function describeMatchEvent(
  event: Pick<MatchEventPayload, 'action' | 'rawAction' | 'possessionType'>,
): MatchActionMeta | null {
  if (NOTABLE_ACTIONS.has(event.action)) return matchActionConfig[event.action];
  const possession = event.possessionType ? POSSESSION_META[event.possessionType] : undefined;
  if (possession) return possession;
  const raw = (event.rawAction ?? '').toLowerCase();
  if (!raw || HIDDEN_RAW.has(raw)) return null;
  return { label: RAW_ACTION_LABELS[raw] ?? humanize(raw), dotClass: 'bg-muted-foreground' };
}
