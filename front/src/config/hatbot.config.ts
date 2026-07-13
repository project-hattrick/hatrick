import { MatchAction } from '@/enums/match-action.enum';
import { TeamSide } from '@/enums/team-side.enum';
import type { CrowdTemplate } from '@/config/crowd-reactions.config';
import type { MatchEventPayload } from '@/types/match';

/** The HatBot chat identity (side is irrelevant — the bot renders its own card). */
export const HATBOT_PERSONA = {
  author: 'HatBot',
  side: TeamSide.Home,
  countryCode: 'BOT',
  flag: '🎩',
  avatar: '',
} as const;

/**
 * Event headlines the bot posts as they happen. Deliberately limited to the "big moments" — a
 * goal, red card, penalty, VAR decision or a genuine big chance. Corners, free kicks, yellow
 * cards and substitutions are left to the simulated stands (see `crowdReactions`) so the bot's
 * single voice stays on the events that actually change the game. See `isMajorEvent`.
 */
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
  [MatchAction.Var]: [
    (c) =>
      c.outcome === 'Overturned'
        ? `📺 VAR OVERTURNS the ${c.varType ?? 'decision'} at ${c.minute}'! Game-changer.`
        : c.outcome === 'Stands'
          ? `📺 VAR checked the ${c.varType ?? 'decision'} — it STANDS. Play on at ${c.minute}'.`
          : `📺 VAR review in progress at ${c.minute}'... decision incoming.`,
  ],
};

/** Shot outcomes that count as a real "big chance" — a blocked/off-target shot is not a headline. */
const MAJOR_SHOT_OUTCOMES = new Set(['OnTarget', 'Saved', 'Woodwork']);

/** True when this event is a HatBot-worthy "principal" moment (goal, red, penalty, VAR, big chance). */
export function isMajorEvent(event: MatchEventPayload): boolean {
  if (!(event.action in hatbotHeadlines)) return false;
  if (event.action === MatchAction.Shot) return MAJOR_SHOT_OUTCOMES.has(event.outcome ?? '');
  return true;
}

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

/** Queue priorities — big moments beat other events beat CTAs beat insights. */
export enum HatBotPriority {
  Insight = 1,
  Cta = 2,
  Event = 3,
  /** Goal / red card / penalty — jumps ahead of a queued big-chance shot so the biggest beat lands first. */
  BigMoment = 4,
}
