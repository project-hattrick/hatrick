import {
  AWAY_TEAM_PACKS,
  REAL_GK_FRANCE_VS_NL_CONFIG,
  type FlagId,
  type RealGkConfig,
  type RealGkFeatures,
  type TeamBrand,
} from './config';
import { allFeelOn } from './sim/feel';

/** Minimal team identity needed to pick a body pack — matches `TeamInfo` from the feed. */
export interface FixtureTeam {
  name: string;
  code: string;
}

/**
 * Body pack roots used when a team has no recolored pack yet ("old" fixtures). They mirror
 * REAL_GK_FRANCE_VS_NL_CONFIG's own defaults (France home body + Netherlands away body) so the two
 * sides stay visually distinct even though neither wears its real kit — the "new model, default style"
 * fallback. Real team NAME still reaches the scoreboard/intro; only the flag + kit are generic.
 */
const HOME_DEFAULT = { root: '/game/franca', brand: { name: 'France', flagId: 'france' as FlagId, colors: ['#0055A4', '#FFFFFF', '#EF4135'] as [string, string, string] } };
const AWAY_DEFAULT = { root: AWAY_TEAM_PACKS.netherlands.root, brand: AWAY_TEAM_PACKS.netherlands.brand };

/** Team codes (from the feed) → pack key, for the cases where the name doesn't match the key 1:1. */
const CODE_TO_PACK: Record<string, keyof typeof AWAY_TEAM_PACKS> = {
  NED: 'netherlands', NLD: 'netherlands', HOL: 'netherlands',
  BRA: 'brazil',
  ARG: 'argentina',
  ESP: 'spain',
  NOR: 'norway',
  ENG: 'england',
  SUI: 'switzerland', SWI: 'switzerland',
};

/** Resolve a feed team to its recolored body pack (by lowercase name first, then 3-letter code). */
export function teamPack(team: FixtureTeam): (typeof AWAY_TEAM_PACKS)[string] | null {
  const byName = team.name?.toLowerCase().trim();
  if (byName && byName in AWAY_TEAM_PACKS) return AWAY_TEAM_PACKS[byName];
  const byCode = CODE_TO_PACK[team.code?.toUpperCase().trim() ?? ''];
  if (byCode) return AWAY_TEAM_PACKS[byCode];
  return null;
}

/** Keep the real team NAME while borrowing the default pack's flag/colors when the team has no pack. */
function fallbackBrand(team: FixtureTeam, base: { name: string; flagId: FlagId; colors: [string, string, string] }): TeamBrand {
  return { name: team.name?.trim() || base.name, flagId: base.flagId, colors: base.colors };
}

export interface FixtureConfigResult {
  config: RealGkConfig;
  /** True only when BOTH teams have real packs — gates the "Signature" screen filter (the style). */
  styled: boolean;
}

/**
 * Build the room engine config from the fixture's two teams — the same recipe as the
 * argentina-vs-norway arena (persona-cast bodies + France stadium geometry + every feel technique on),
 * but with the body packs resolved per team. Upcoming fixtures whose teams have recolored packs render
 * their real kits + the Signature filter; older fixtures fall back to the default France/Netherlands
 * bodies with no filter ("new model, default, no style"). `crtFilter` is forced off — the styled path
 * applies the richer Signature overlay externally, so the built-in CRT must not stack on top.
 */
export function buildRealGkFixtureConfig(home: FixtureTeam, away: FixtureTeam): FixtureConfigResult {
  const homePack = teamPack(home);
  const awayPack = teamPack(away);
  const styled = homePack !== null && awayPack !== null;

  return {
    styled,
    config: {
      ...REAL_GK_FRANCE_VS_NL_CONFIG,
      // Room liveliness: between real feed events, allow harmless autonomous action (saved shots, slide
      // tackles, intercepts) so a 90' watch reads like a real match instead of freezing between beats.
      // Goals/score stay strictly feed-authoritative (a driven ball can never self-score — see filler.ts).
      features: { ...(REAL_GK_FRANCE_VS_NL_CONFIG.features as RealGkFeatures), drivenFiller: true, goalFrame: true },
      personaBodyRoot: homePack?.root ?? HOME_DEFAULT.root,
      personaBodyRootAway: awayPack?.root ?? AWAY_DEFAULT.root,
      teams: {
        blue: homePack?.brand ?? fallbackBrand(home, HOME_DEFAULT.brand),
        red: awayPack?.brand ?? fallbackBrand(away, AWAY_DEFAULT.brand),
      },
      // Room framing: pull the camera back so more of the pitch — including the far-touchline billboards
      // (placas) — fits and the players aren't cramped at the bottom. `cameraLift` biases the follow-cam
      // up toward those billboards. These are eyeball-tuned knobs (zoom vs lift balance each other).
      presets: [
        { label: 'Broadcast', zoom: 1.2, follow: true },
        { label: 'Close', zoom: 1.6, follow: true },
        { label: 'Wide', zoom: 1.0, follow: true },
        { label: 'Full pitch', zoom: 0.7, follow: false },
      ],
      cameraLift: 0.14,
      actorScale: { referee: 1.05, coach: 1.3 },
      // Snappier goal replay for the room (cinematic default is ~10s): ~1.6s footage at 0.55× + 0.8s wipes.
      replayTiming: { lookback: 1.6, speed: 0.55, wipe: 0.8 },
      feel: allFeelOn(),
      crtFilter: false,
    },
  };
}
