import { Team } from '../enums';

/** Ticker messages emitted during a match (English — content, centralized to avoid magic strings). */
export const MatchEvent = {
  TeamsEntering: '⚽ Teams entering…',
  Save: '🧤 Save!',
  GoalKick: '🧤 Goal kick',
  Shot: '⚽ Shot!',
  Cross: '🪁 Cross!',
  Pass: '➡️ Pass',
  SlideTackle: '🦵 Slide tackle!',
  LooseBall: '🤜 Loose ball!',
  Cleared: '',
} as const;

export const TEAM_LABEL: Record<Team, string> = {
  [Team.Blue]: 'BLUE',
  [Team.Red]: 'RED',
};

export const goalMessage = (team: Team): string => `⚽⚽ GOAL — ${TEAM_LABEL[team]}!`;
