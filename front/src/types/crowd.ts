import type { TeamSide } from '@/enums/team-side.enum';
import type { CrowdSource } from '@/enums/crowd-source.enum';

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
}
