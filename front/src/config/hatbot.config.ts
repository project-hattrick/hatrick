import { MatchAction } from '@/enums/match-action.enum';
import { TeamSide } from '@/enums/team-side.enum';
import type { CrowdTemplate } from '@/config/crowd-reactions.config';

/** The HatBot chat identity (side is irrelevant — the bot renders its own card). */
export const HATBOT_PERSONA = {
  author: 'HatBot',
  side: TeamSide.Home,
  countryCode: 'BOT',
  flag: '🎩',
  avatar: '',
} as const;

/** Event headlines the bot posts as they happen. */
export const hatbotHeadlines: Partial<Record<MatchAction, CrowdTemplate[]>> = {
  [MatchAction.Goal]: [
    (c) => `⚽ GOAL! ${c.scoreline} — ${c.playerLabel ?? c.teamName} strikes at ${c.minute}'!`,
  ],
  [MatchAction.Penalty]: [
    (c) =>
      c.outcome === 'Missed'
        ? `🥅 PENALTY MISSED by ${c.teamName} at ${c.minute}'! Off the hook — ${c.scoreline}.`
        : c.outcome === 'Saved'
          ? `🧤 PENALTY SAVED! The keeper denies ${c.teamName} at ${c.minute}' — ${c.scoreline}.`
          : c.outcome === 'Retake'
            ? `🔁 Penalty RETAKE ordered at ${c.minute}'! Ice-cold nerves needed.`
            : `🎯 PENALTY to ${c.teamName} at ${c.minute}'! Huge moment — ${c.scoreline}.`,
  ],
  [MatchAction.Shot]: [
    (c) =>
      c.outcome === 'Woodwork'
        ? `🪵 OFF THE WOODWORK! ${c.teamName} rattle the frame at ${c.minute}'.`
        : `🧤 Big chance! ${c.teamName} force a save at ${c.minute}'.`,
  ],
  [MatchAction.RedCard]: [
    (c) => `🟥 RED CARD! ${c.teamName} down to 10 men at ${c.minute}'.`,
  ],
  [MatchAction.YellowCard]: [
    (c) => `🟨 Yellow card for ${c.playerLabel ?? c.teamName} at ${c.minute}'.`,
  ],
  [MatchAction.Corner]: [
    (c) => `🚩 Corner for ${c.teamName} — pressure building at ${c.minute}'.`,
  ],
  [MatchAction.Var]: [
    (c) =>
      c.outcome === 'Overturned'
        ? `📺 VAR OVERTURNS the ${c.varType ?? 'decision'} at ${c.minute}'! Game-changer.`
        : c.outcome === 'Stands'
          ? `📺 VAR checked the ${c.varType ?? 'decision'} — it STANDS. Play on at ${c.minute}'.`
          : `📺 VAR review in progress at ${c.minute}'... decision incoming.`,
  ],
  [MatchAction.Substitution]: [
    (c) => `🔁 Substitution for ${c.teamName} at ${c.minute}'.`,
  ],
  [MatchAction.FreeKick]: [
    (c) => `⚡ Dangerous free kick for ${c.teamName} at ${c.minute}'.`,
  ],
};

/** Bot pacing — one voice, never spammy. */
export const HATBOT_CADENCE = {
  /** Minimum gap between any two bot messages. */
  minBotGapMs: 8_000,
  /** How often a betting CTA may appear. */
  ctaCooldownMs: 45_000,
  /** How often a stats insight may appear. */
  insightCooldownMs: 30_000,
  /** How often (and how many times) a guest is nudged to sign in. */
  loginCooldownMs: 90_000,
  maxLoginPrompts: 3,
  /** Ambient fan chatter interval (slower than events feel). */
  ambientMs: 7_000,
  /** Queue drain tick. */
  drainTickMs: 1_000,
  /** Queued items older than this are dropped (moment has passed). */
  staleMs: 60_000,
  /** Delay before the post-goal "odds shifted" CTA. */
  postGoalCtaDelayMs: 6_000,
} as const;

/** Queue priorities — event reactions beat CTAs beat insights. */
export enum HatBotPriority {
  Insight = 1,
  Cta = 2,
  Event = 3,
}
