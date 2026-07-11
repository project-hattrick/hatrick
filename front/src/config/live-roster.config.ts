import type { LiveMatch, MatchEventPayload, TeamInfo } from '@/types/match';
import { teamPlayerLabel } from '@/lib/player-identity';

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
  rating: number;
  pass: string;
  touches: number;
  goals: number;
  onBall: boolean;
  /** Pixel-art portrait in /public/cards. */
  portraitSrc: string;
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

function playersForSide(team: TeamInfo): FocusPlayer[] {
  return FOCUS_SLOTS.map((slot) => {
    const id = `${team.code}-${slot.shirt}`;
    return {
      id,
      name: teamPlayerLabel(team.code, slot.shirt),
      team: team.name,
      position: slot.position,
      code: `#${slot.shirt}`,
      onBall: false,
      portraitSrc: slot.portraitSrc,
      ...statsFor(id),
    };
  });
}

/**
 * Build the hero focus roster from the current fixture (home then away front-lines). The latest live
 * event decides who's on the ball: its `participant` picks the side, its seq picks the man — so the
 * card reflects the real match instead of a hardcoded name. The on-ball player is moved to the front
 * so the card opens on "ON THE BALL".
 */
export function buildFocusRoster(match: LiveMatch, latest?: MatchEventPayload): FocusPlayer[] {
  const home = playersForSide(match.home);
  const away = playersForSide(match.away);
  const roster = [...home, ...away];

  const side = latest?.participant === 2 ? away : home;
  const slot = latest ? latest.seq % FOCUS_SLOTS.length : 1;
  const onBall = side[slot] ?? side[0];
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
