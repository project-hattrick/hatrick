import { TeamSide } from '@/enums/team-side.enum';

interface TeamSideMeta {
  tone: string;
}

export const teamSideConfig: Record<TeamSide, TeamSideMeta> = {
  [TeamSide.Home]: { tone: 'text-team-home' },
  [TeamSide.Away]: { tone: 'text-team-away' },
};

export const teamSideFallback: TeamSideMeta = { tone: 'text-muted-foreground' };
