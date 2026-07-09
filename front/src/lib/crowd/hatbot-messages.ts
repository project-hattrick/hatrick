import { CrowdSource } from '@/enums/crowd-source.enum';
import { CrowdActionKind } from '@/enums/crowd-action-kind.enum';
import { MatchAction } from '@/enums/match-action.enum';
import { MarketType } from '@/enums/market-type.enum';
import { TeamSide } from '@/enums/team-side.enum';
import { BETTING_MARKETS } from '@/config/betting-markets.config';
import { HATBOT_PERSONA, hatbotHeadlines } from '@/config/hatbot.config';
import { buildReactionContext } from '@/lib/crowd/reaction-context';
import { deriveMatchStats } from '@/lib/match-stats';
import { useAuthStore } from '@/store/auth.store';
import type { Bet, BetSelection } from '@/types/bet';
import type { CrowdMessage, CrowdMessageAction } from '@/types/crowd';
import type { LiveMatch, MatchEventPayload } from '@/types/match';

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function botMessage(text: string, action?: CrowdMessageAction): CrowdMessage {
  return {
    id: crypto.randomUUID(),
    ...HATBOT_PERSONA,
    text,
    ageLabel: 'now',
    source: CrowdSource.HatBot,
    action,
  };
}

/** Event headline — goals also carry a share action (the moment worth posting). */
export function buildHeadline(match: LiveMatch, event: MatchEventPayload): CrowdMessage | null {
  const templates = hatbotHeadlines[event.action];
  if (!templates || templates.length === 0) return null;
  const ctx = buildReactionContext(match, event);
  const text = pick(templates)(ctx);
  if (event.action !== MatchAction.Goal) return botMessage(text);
  const shareText = `${ctx.playerLabel ?? ctx.teamName} scores! ${ctx.scoreline} at ${ctx.minute}' — watching live on Hat-trick 🎩⚽`;
  return botMessage(text, { kind: CrowdActionKind.ShareMoment, shareText });
}

/** The Next Goal selection relabeled with the live team name (markets-panel pattern). */
function nextGoalSelection(match: LiveMatch | null): BetSelection | null {
  const market = BETTING_MARKETS.find((def) => def.market === MarketType.NextGoal);
  if (!market) return null;
  const sideIds: Record<string, TeamSide> = { home: TeamSide.Home, away: TeamSide.Away };
  const teamSelections = market.selections.filter((selection) => selection.selectionId in sideIds);
  const base = pick(teamSelections.length > 0 ? teamSelections : market.selections);
  if (!match) return base;
  const team = sideIds[base.selectionId] === TeamSide.Away ? match.away : match.home;
  return { ...base, label: team.name };
}

const CTA_HOOKS = [
  'Feeling the momentum?',
  'The stands are buzzing —',
  'Odds are moving.',
  'Trust your read on this game?',
];

/** Periodic betting CTA — one tap pre-fills the slip with a live-labeled selection. */
export function buildBetCta(match: LiveMatch | null): CrowdMessage | null {
  const selection = nextGoalSelection(match);
  if (!selection) return null;
  return botMessage(`${pick(CTA_HOOKS)} Next Goal: ${selection.label} pays ${selection.odds.toFixed(2)}x.`, {
    kind: CrowdActionKind.OpenBetSlip,
    label: `Bet ${selection.label} @ ${selection.odds.toFixed(2)}`,
    selection,
  });
}

/** Post-goal CTA — the odds board just shifted, strike while it's hot. */
export function buildPostGoalCta(match: LiveMatch | null): CrowdMessage | null {
  const selection = nextGoalSelection(match);
  if (!selection) return null;
  return botMessage(`📊 Odds shifted after that goal! Next Goal: ${selection.label} now at ${selection.odds.toFixed(2)}x.`, {
    kind: CrowdActionKind.OpenBetSlip,
    label: `Bet ${selection.label} @ ${selection.odds.toFixed(2)}`,
    selection,
  });
}

const LOGIN_HOOKS = [
  'Enjoying the match? Sign in to keep your coins, bets and duel record.',
  'You are watching as a guest — sign in to place bets that count.',
  'Connect your wallet to unlock the full Hat-trick experience.',
];

/** Guest-only login nudge — null for signed-in users. */
export function buildLoginCta(): CrowdMessage | null {
  if (useAuthStore.getState().status !== 'guest') return null;
  return botMessage(pick(LOGIN_HOOKS), { kind: CrowdActionKind.OpenLogin, label: 'Sign in' });
}

/** A stats insight derived from the live event stream. */
export function buildInsight(match: LiveMatch | null, events: MatchEventPayload[]): CrowdMessage | null {
  if (!match || events.length === 0) return null;
  const stats = deriveMatchStats(events);
  const ctx = buildReactionContext(match);
  const lines: string[] = [];
  if (stats.home.corners + stats.away.corners > 0) {
    lines.push(`📈 Corners: ${match.home.code} ${stats.home.corners} × ${stats.away.corners} ${match.away.code} — set pieces are deciding this.`);
  }
  if (stats.home.yellow + stats.away.yellow > 0) {
    lines.push(`🟨 Cards so far: ${match.home.code} ${stats.home.yellow} × ${stats.away.yellow} ${match.away.code}. Tempers rising.`);
  }
  const recent = events.filter((event) => (event.minute ?? 0) >= match.minute - 10);
  if (recent.length >= 2) {
    lines.push(`⚡ ${recent.length} big moments in the last 10 minutes — this game is heating up.`);
  }
  lines.push(`⏱️ ${ctx.scoreline} at ${match.minute}'. Every touch matters now.`);
  return botMessage(pick(lines));
}

/** Celebration when the user's bet settles as a win — with a brag-worthy share. */
export function buildBetWon(bet: Bet): CrowdMessage {
  const payout = Math.round(bet.stake * bet.odds);
  const shareText = `Just won ${payout.toLocaleString()} coins on ${bet.label} (${bet.matchLabel}) on Hat-trick 🎩🔥`;
  return botMessage(`🎉 Someone in the crowd just cashed ${payout.toLocaleString()} coins on "${bet.label}"! That's how it's done.`, {
    kind: CrowdActionKind.ShareMoment,
    shareText,
  });
}
