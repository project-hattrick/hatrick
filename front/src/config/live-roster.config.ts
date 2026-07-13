import type {
  LineupsBySide,
  LiveMatch,
  MatchEventPayload,
  PlayerStatsBySide,
  TeamInfo,
} from '@/types/match';
import { numberForId, teamPlayerLabel } from '@/lib/player-identity';
import { liveFormBoost, nameForPlayer, playerForShirt, shirtForPlayer, statsForPlayer } from '@/lib/player-form';

/** A player that can hold the ball in the live hero focus card — derived from the current fixture. */
export interface FocusPlayer {
  id: string;
  /** Licensing-safe `${CODE}-${number}` label (e.g. ARG-9). */
  name: string;
  /** Real team name of the fixture side. */
  team: string;
  position: string;
  /** Short mono tag shown in the header, e.g. "#9". */
  code: string;
  shirt: number;
  rating: number;
  pass: string;
  touches: number;
  goals: number;
  /** Live form delta already applied to `rating` (0 = no real stats yet) — drives the FORM chip. */
  formBoost: number;
  /** REAL shots from the feed, when the player has stats this match. */
  shots?: number;
  onBall: boolean;
  /** Pixel-art portrait in /public/cards. */
  portraitSrc: string;
}

/** Real-feed context: lineups map player IDs to shirts; stats overlay the seeded numbers. */
export interface FocusContext {
  lineups?: LineupsBySide | null;
  playerStats?: PlayerStatsBySide;
}

/** The front-line the focus carousel walks through, per side — shirt number + position + portrait. */
const FOCUS_SLOTS = [
  { shirt: 10, position: 'CAM', portraitSrc: '/cards/player-93.png' },
  { shirt: 9, position: 'ST', portraitSrc: '/cards/player-green.png' },
  { shirt: 11, position: 'LW', portraitSrc: '/cards/player-93.png' },
  { shirt: 7, position: 'RW', portraitSrc: '/cards/player-green.png' },
] as const;

/** Deterministic per-player stats so a given `${CODE}-${number}` always reads the same (never random). */
function statsFor(id: string): { rating: number; pass: string; touches: number; goals: number } {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const next = (): number => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rint = (lo: number, hi: number): number => Math.floor(lo + next() * (hi - lo + 1));
  return { rating: rint(78, 95), pass: `${rint(74, 93)}%`, touches: rint(28, 72), goals: rint(0, 3) };
}

function makeFocusPlayer(
  team: TeamInfo,
  shirt: number,
  position: string,
  portraitSrc: string,
  realName?: string,
): FocusPlayer {
  const id = `${team.code}-${shirt}`;
  return {
    id,
    name: realName?.trim() || teamPlayerLabel(team.code, shirt),
    team: team.name,
    position,
    code: `#${shirt}`,
    shirt,
    formBoost: 0,
    onBall: false,
    portraitSrc,
    ...statsFor(id),
  };
}

function playersForSide(team: TeamInfo): FocusPlayer[] {
  return FOCUS_SLOTS.map((slot) => makeFocusPlayer(team, slot.shirt, slot.position, slot.portraitSrc));
}

/** Overlay REAL player names from the feed lineups onto a side's seeded players (by shirt). */
function applyRealNames(players: FocusPlayer[], side: 'home' | 'away', context?: FocusContext): void {
  if (!context?.lineups) return;
  for (const player of players) {
    const playerId = playerForShirt(context.lineups, side, player.shirt);
    if (!playerId) continue;
    const realName = nameForPlayer(context.lineups, side, playerId);
    if (realName) player.name = realName;
  }
}

/** Overlay REAL feed stats onto a side's seeded players: actual goals/shots + a form swing on the rating. */
function applyRealStats(players: FocusPlayer[], side: 'home' | 'away', context?: FocusContext): void {
  if (!context?.playerStats) return;
  for (const player of players) {
    const playerId = playerForShirt(context.lineups, side, player.shirt);
    if (!playerId) continue;
    const stats = statsForPlayer(context.playerStats, side, playerId);
    if (!stats) continue;
    if (stats.goals !== undefined) player.goals = stats.goals;
    if (stats.shots !== undefined) player.shots = stats.shots;
    player.formBoost = liveFormBoost(stats);
    player.rating = Math.min(99, player.rating + player.formBoost);
  }
}

/**
 * Build the hero focus roster from the current fixture (home then away front-lines). The latest live
 * event decides who's on the ball. With real-feed context, the event's TxLINE `playerId` picks the
 * actual man (lineups map him to his shirt; without lineups a deterministic shirt stands in) and the
 * REAL per-player stats overlay the seeded ones. Without context it falls back to participant + seq.
 * The on-ball player is moved to the front so the card opens on "ON THE BALL".
 */
export function buildFocusRoster(
  match: LiveMatch,
  latest?: MatchEventPayload,
  context?: FocusContext,
): FocusPlayer[] {
  const home = playersForSide(match.home);
  const away = playersForSide(match.away);
  applyRealNames(home, 'home', context);
  applyRealNames(away, 'away', context);
  applyRealStats(home, 'home', context);
  applyRealStats(away, 'away', context);
  const roster = [...home, ...away];

  const sideKey: 'home' | 'away' = latest?.participant === 2 ? 'away' : 'home';
  const side = sideKey === 'away' ? away : home;
  let onBall: FocusPlayer | undefined;

  // Real attribution first: the event names the player, the lineups name his shirt.
  if (latest?.playerId) {
    const shirt = shirtForPlayer(context?.lineups, sideKey, latest.playerId) ?? numberForId(latest.playerId);
    onBall = side.find((p) => p.shirt === shirt);
    if (!onBall) {
      const slot = FOCUS_SLOTS[shirt % FOCUS_SLOTS.length];
      const realName = nameForPlayer(context?.lineups, sideKey, latest.playerId);
      onBall = makeFocusPlayer(sideKey === 'away' ? match.away : match.home, shirt, slot.position, slot.portraitSrc, realName);
      const stats = statsForPlayer(context?.playerStats, sideKey, latest.playerId);
      if (stats?.goals !== undefined) onBall.goals = stats.goals;
      if (stats?.shots !== undefined) onBall.shots = stats.shots;
      onBall.formBoost = liveFormBoost(stats);
      onBall.rating = Math.min(99, onBall.rating + onBall.formBoost);
      side.push(onBall);
      roster.push(onBall);
    }
  }
  onBall ??= side[latest ? latest.seq % FOCUS_SLOTS.length : 1] ?? side[0];
  onBall.onBall = true;

  return [onBall, ...roster.filter((p) => p !== onBall)];
}

/** Positive modulo so prev/next wrap cleanly around the roster. */
export function focusAt(
  roster: FocusPlayer[],
  index: number,
): { player: FocusPlayer; position: number; total: number } {
  const total = roster.length;
  const wrapped = ((index % total) + total) % total;
  return { player: roster[wrapped], position: wrapped + 1, total };
}
