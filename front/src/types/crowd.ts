import type { TeamSide } from '@/enums/team-side.enum';
import type { CrowdSource } from '@/enums/crowd-source.enum';
import type { CrowdActionKind } from '@/enums/crowd-action-kind.enum';
import type { BetSelection } from '@/types/bet';

/** Inline CTA payload rendered as a button inside a HatBot message. */
export interface CrowdMessageAction {
  kind: CrowdActionKind;
  /** Button label, e.g. "Bet France next goal @ 2.05". */
  label?: string;
  /** Bet slip payload when kind is OpenBetSlip. */
  selection?: BetSelection;
  /** Prefilled text when kind is ShareMoment. */
  shareText?: string;
}

/** A single chat message that becomes a balloon over the stands. */
export interface CrowdMessage {
  id: string;
  author: string;
  side: TeamSide;
  countryCode: string;
  flag: string;
  avatar: string;
  text: string;
  ageLabel: string;
  source: CrowdSource;
  action?: CrowdMessageAction;
}
