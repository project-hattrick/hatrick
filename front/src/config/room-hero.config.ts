/**
 * Room-only hero-figure placements for the "starting soon" bet-panel header.
 *
 * The landing hero card and the room header render the SAME pixel-art figures, but the room
 * frame is narrower (150px header, scaled down). Tuning the shared HERO_PORTRAITS would shift
 * the landing hero, so the room keeps its own overrides here. Tune them in
 * `/sandbox/room-hero`, then paste the generated entries into ROOM_HERO_PLACEMENTS below.
 */
import {
  heroTeamFor,
  type HeroFigurePlacement,
  type HeroTeam,
} from './match-dashboard.config';

type Side = 'home' | 'away';

/**
 * Legacy nudge: the room header is narrower than the landing card, so figures WITHOUT a tuned
 * room override are pushed outward to keep the centred title clear. Baked into the fallback path
 * only — a tuned room override replaces the placement outright.
 */
const FIGURE_OUTSET = 24;

/**
 * Room-specific placement overrides, keyed by FIFA code. Empty = every team uses the shared
 * landing placement nudged outward (the historical room look). Add entries via the editor.
 */
export const ROOM_HERO_PLACEMENTS: Record<string, Partial<Record<Side, HeroFigurePlacement>>> = {
  ARG: {
    home: { width: 190, x: -72, y: 0, scale: 0.94, flip: false, objectY: 5 },
    away: { width: 170, x: -104, y: 8, scale: 0.97, flip: true, objectY: 0 },
  },
  SUI: {
    home: { width: 170, x: -66, y: 0, scale: 0.94, flip: false, objectY: 5 },
    away: { width: 170, x: -104, y: 8, scale: 0.97, flip: true, objectY: 0 },
  },
  MAR: {
    home: { width: 170, x: -66, y: 0, scale: 0.94, flip: false, objectY: 5 },
    away: { width: 170, x: -104, y: 8, scale: 0.97, flip: true, objectY: 0 },
  },
  BEL: {
    home: { width: 170, x: -66, y: 0, scale: 0.94, flip: false, objectY: 5 },
    away: { width: 170, x: -104, y: 8, scale: 0.97, flip: true, objectY: 0 },
  },
  FRA: {
    home: { width: 170, x: -66, y: 0, scale: 0.94, flip: false, objectY: 5 },
    away: { width: 170, x: -104, y: 8, scale: 0.97, flip: true, objectY: 0 },
  },
};

/** Whether a team+side has a hand-tuned room placement (vs. the outset fallback). */
export function hasRoomPlacement(fifaCode: string, side: Side): boolean {
  return Boolean(ROOM_HERO_PLACEMENTS[fifaCode.toUpperCase()]?.[side]);
}

/**
 * Hero figure for the room header. Uses the room override when present; otherwise falls back to
 * the shared landing placement nudged outward by FIGURE_OUTSET. The portrait art is always
 * resolved through the shared config, so only positioning is room-specific.
 */
export function roomHeroTeamFor(name: string, fifaCode: string, side: Side): HeroTeam {
  const base = heroTeamFor(name, fifaCode, side);
  const override = ROOM_HERO_PLACEMENTS[fifaCode.toUpperCase()]?.[side];
  if (override) return { ...base, placement: { ...override } };
  const x = side === 'home' ? base.placement.x - FIGURE_OUTSET : base.placement.x + FIGURE_OUTSET;
  return { ...base, placement: { ...base.placement, x } };
}
