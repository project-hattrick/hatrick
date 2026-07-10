import { CheckpointId } from '../checkpoints/types';

/** A follow-camera preset in the cycle ring. */
export interface CamPreset {
  label: string;
  zoom: number;
  follow: boolean;
}

/** Opt-in v4 behaviors. Undefined (v2/v3/hero) keeps every legacy code path byte-identical. */
export interface RealGkFeatures {
  /** turn_side / stop_brake actions in the outfield AI. */
  extraAnims: boolean;
  /** Goal celebration sequences (arms-up / knee slide) for the scoring team. */
  celebrations: boolean;
  /** Broadcast goal flow: TV wipe → slow-motion replay → kickoff. */
  replay: boolean;
  /** Size composited actors by visible body height so heads never inflate them. */
  normalizedSizes: boolean;
  /** Late-afternoon stadium shadow that covers ~half the pitch and slowly creeps across. */
  duskShadow: boolean;
  /** Playable sandbox: two same-team players under keyboard control (pass switches control). */
  playable: boolean;
  /** Render the goal net (traves + rede) in layers at both goal lines. */
  goalNet: boolean;
  /** Perimeter advertiser panels (image + LED boards) pinned to the pitch (see billboards.ts). */
  billboards: boolean;
  /** v5 matchday entrance: team+flag showcase → players walk on → referee whistles → kickoff. */
  matchIntro: boolean;
  /** v5 dead balls: the ball rolls out of play, a banner names the restart, a taker walks over and restarts. */
  deadBallSequence: boolean;
  /** v5 fouls: contested challenges can stop play — referee run-in, whistle or red card + send-off,
   *  then a free kick with a wall or a penalty with the full box staging. Requires deadBallSequence. */
  fouls: boolean;
  /** Court-test overlay: draws the pitch trapezoid, out-of-play lines, center spot, goal mouths and
   *  restart spots on the canvas so the field calibration can be verified in-game. */
  debugBounds: boolean;
  /** v6 keeper: the approved candidate_01 dive pack — crouch anticipation, smeared ghost-trail launch,
   *  prone slide and kneel recovery — instead of the legacy 8-frame dive. */
  keeperDiveV2: boolean;
  /** Keeper save = the assets-playground `gk_dive_save` pack (8-frame lateral dive with the composited
   *  side/front head) instead of the compact dive. Ignored when `keeperDiveV2` is on. */
  keeperDiveSave?: boolean;
  /** Ground-contact particles for the ball: dust bloom and small turf flecks. */
  ballEffects?: boolean;
  /** Persona casting: outfield players wear headless bodies + per-persona composited heads (no baked
   *  face), so the squad shows distinct characters. Requires the persona assets (loaded when set). */
  personaHeads?: boolean;
  /** Animate the near-goal strike (regen shot body, composited head) instead of the instant strike —
   *  keeps the rest of the match script identical. Independent of `extraAnims`. */
  personaShot?: boolean;
  /** AI slide tackles (carrinho): a defender near the opponent ball-carrier slides in to win the ball. */
  slideTackles?: boolean;
  /** Lifelike positioning: stable per-player position jitter + varied facings (not everyone staring at the
   *  ball) + a sweeper-keeper that comes off its line. Only affects gated checkpoints. */
  livelyMatch?: boolean;
  /** Feed-driven filler: between real feed events, allow harmless autonomous action (saved/missed shots,
   *  slide tackles, intercepts) so a 90' watch stays alive. Goals/score remain feed-only. */
  drivenFiller?: boolean;
  /** Match structure beats via `handle.setPhase`: half-time walk-off + banner, full-time whistle with the
   *  winner celebrating, then a frozen sim under the final-score overlay. Off → setPhase is a no-op. */
  matchStructure?: boolean;
}

/** A national/team brand for the v5 intro showcase (flag + name + tricolor palette). */
export type FlagId = 'france' | 'spain' | 'brazil' | 'argentina';

export interface TeamBrand {
  name: string;
  flagId: FlagId;
  /** Three-stop palette used for the intro flag stripes / confetti when a real flag isn't drawn. */
  colors: [string, string, string];
}

/**
 * Tunables that define a Real Match GK *variant*. The engine, sim and renderer are shared; a config
 * is what makes "Cinema" feel bigger than "v2": a larger virtual pitch (players cover more ground, so
 * they read as smaller and cross slower) plus tighter sprites and a dramatic, dynamically-zooming camera.
 */
export interface RealGkConfig {
  /** Virtual pitch size as a multiple of the viewport. 1 = pitch fits the screen; >1 = the camera pans a larger field. */
  fieldScale: number;
  /** Sprite height range (far → near), in field pixels. Smaller = tinier players on a vaster pitch. */
  spriteMinH: number;
  spriteMaxH: number;
  /** Ball size multiplier (and its shadow). Defaults to 1; smaller reads better with tiny players. */
  ballScale?: number;
  /** Camera preset ring (first entry is the default). */
  presets: CamPreset[];
  /** Cinematic camera: eases slower, leads the ball, and pushes in on shots / near-goal action. */
  cinematic: boolean;
  /** v4 feature gates — leave unset to keep the exact legacy behavior. */
  features?: RealGkFeatures;
  /** How many controllable players the playable sandbox spawns (1 = solo court test; default 2). */
  playableRoster?: number;
  /** Per-actor height multipliers; unset falls back to the legacy constants (referee 0.9, coach 1.06). */
  actorScale?: { referee?: number; coach?: number };
  /** Max cinematic zoom push near a goal (legacy default 1.32). */
  nearGoalPush?: number;
  /** Vertical framing bias as a fraction of pitch height: positive lifts the follow view UP toward the far
   *  touchline (the billboards / telões), so the action reads nearer them. Unset/0 = centered on the ball. */
  cameraLift?: number;
  /** Team brands for the v5 intro showcase (flags + names). Unset → generic Blue/Red. */
  teams?: { blue: TeamBrand; red: TeamBrand };
  /** Optional root for custom persona body frames. Defaults to /game/personas. */
  personaBodyRoot?: string;
  /** Optional multiplier for persona head composition. Defaults to 1. */
  personaHeadScale?: number;
  /** Light retro-TV overlay on the stage (faint scanlines + RGB mask + vignette). */
  crtFilter?: boolean;
}

/** Checkpoint 3 — the original Real Match GK feel. Pitch fits the screen 1:1. */
export const REAL_GK_V2_CONFIG: RealGkConfig = {
  fieldScale: 1,
  spriteMinH: 35,
  spriteMaxH: 58,
  presets: [
    { label: 'Broadcast', zoom: 1.9, follow: true },
    { label: 'Close', zoom: 2.6, follow: true },
    { label: 'Wide', zoom: 1.4, follow: true },
    { label: 'Full pitch', zoom: 1.0, follow: false },
  ],
  cinematic: false,
};

/** Home hero backdrop — small players on a larger pitch, calm cinematic camera + the tuned visual styles. */
export const REAL_GK_HERO_CONFIG: RealGkConfig = {
  fieldScale: 1.5,
  spriteMinH: 26,
  spriteMaxH: 44,
  ballScale: 0.62,
  presets: [
    { label: 'Broadcast', zoom: 1.7, follow: true },
    { label: 'Close', zoom: 2.2, follow: true },
    { label: 'Wide', zoom: 1.3, follow: true },
    { label: 'Full pitch', zoom: 0.7, follow: false },
  ],
  cinematic: true,
  // Visual polish only — keeps the hero's instant shot + sizes (no extraAnims/celebrations/replay/playable).
  features: { extraAnims: false, celebrations: false, replay: false, normalizedSizes: false, duskShadow: true, playable: false, goalNet: false, billboards: false, matchIntro: false, deadBallSequence: false, fouls: false, debugBounds: false, keeperDiveV2: false },
  actorScale: { referee: 0.95, coach: 0.95 },
};

/** Checkpoint 4 — "Cinema": a large pitch the camera roams, small players, dramatic dynamic zoom. */
export const REAL_GK_CINEMA_CONFIG: RealGkConfig = {
  fieldScale: 1.85,
  spriteMinH: 22,
  spriteMaxH: 38,
  presets: [
    { label: 'Cinematic', zoom: 1.2, follow: true },
    { label: 'Tight', zoom: 1.75, follow: true },
    { label: 'Aerial', zoom: 0.82, follow: true },
    { label: 'Full pitch', zoom: 0.55, follow: false },
  ],
  cinematic: true,
};

/** Checkpoint 5 — "Broadcast": hero-standardized sizes, new anims, celebrations and TV goal replays. */
export const REAL_GK_V4_CONFIG: RealGkConfig = {
  fieldScale: 1.5,
  spriteMinH: 26,
  spriteMaxH: 44,
  ballScale: 0.62,
  presets: [
    { label: 'Broadcast', zoom: 1.7, follow: true },
    { label: 'Close', zoom: 2.2, follow: true },
    { label: 'Wide', zoom: 1.3, follow: true },
    { label: 'Full pitch', zoom: 0.7, follow: false },
  ],
  cinematic: true,
  features: { extraAnims: true, celebrations: true, replay: true, normalizedSizes: true, duskShadow: true, playable: false, goalNet: false, billboards: true, matchIntro: false, deadBallSequence: false, fouls: false, debugBounds: false, keeperDiveV2: false },
  actorScale: { referee: 0.95, coach: 0.95 },
  nearGoalPush: 1.42,
};

/**
 * Playable sandbox — the HERO look (best feel: instant shot, hero sprite sizes, cinematic camera) made
 * controllable, with goal celebrations added. `extraAnims: false` keeps the crisp instant strike;
 * `celebrations: true` (with the v4 anim pack still loaded because `features` is defined) adds the party.
 */
export const REAL_GK_PLAY_CONFIG: RealGkConfig = {
  fieldScale: 1.5,
  spriteMinH: 26,
  spriteMaxH: 44,
  ballScale: 0.62,
  presets: [
    { label: 'Broadcast', zoom: 1.7, follow: true },
    { label: 'Close', zoom: 2.2, follow: true },
    { label: 'Wide', zoom: 1.3, follow: true },
    { label: 'Full pitch', zoom: 0.7, follow: false },
  ],
  cinematic: true,
  features: { extraAnims: false, celebrations: true, replay: false, normalizedSizes: true, duskShadow: true, playable: true, goalNet: false, billboards: false, matchIntro: false, deadBallSequence: false, fouls: false, debugBounds: false, keeperDiveV2: false },
  actorScale: { referee: 0.95, coach: 0.95 },
};

/**
 * Solo court test — ONE controllable player on the empty court with the calibration overlay on:
 * pitch trapezoid, out-of-play lines, center spot, goal mouths and restart spots drawn in-game.
 * Dead-ball flow stays on so kicking the ball out shows exactly where the lines catch it.
 */
export const REAL_GK_SOLO_CONFIG: RealGkConfig = {
  fieldScale: 1.5,
  spriteMinH: 26,
  spriteMaxH: 44,
  ballScale: 0.62,
  presets: [
    { label: 'Broadcast', zoom: 1.7, follow: true },
    { label: 'Close', zoom: 2.2, follow: true },
    { label: 'Wide', zoom: 1.3, follow: true },
    { label: 'Full pitch', zoom: 0.7, follow: false },
  ],
  cinematic: true,
  features: { extraAnims: false, celebrations: false, replay: false, normalizedSizes: true, duskShadow: true, playable: true, goalNet: false, billboards: false, matchIntro: false, deadBallSequence: true, fouls: false, debugBounds: true, keeperDiveV2: false },
  actorScale: { referee: 0.95, coach: 0.95 },
  playableRoster: 1,
};

/** Effects lab — a clean playable field with ball-impact particles and a repeatable high drop. */
export const EFFECTS_LAB_CONFIG: RealGkConfig = {
  ...REAL_GK_PLAY_CONFIG,
  features: { ...(REAL_GK_PLAY_CONFIG.features as RealGkFeatures), ballEffects: true },
  playableRoster: 1,
};

/** Auto full match — identical look/assets to the sandbox, but 11-a-side AI with goal replays. */
export const REAL_GK_MATCH_CONFIG: RealGkConfig = {
  fieldScale: 1.5,
  spriteMinH: 26,
  spriteMaxH: 44,
  ballScale: 0.62,
  presets: [
    { label: 'Broadcast', zoom: 1.7, follow: true },
    { label: 'Close', zoom: 2.2, follow: true },
    { label: 'Wide', zoom: 1.3, follow: true },
    { label: 'Full pitch', zoom: 0.7, follow: false },
  ],
  cinematic: true,
  features: { extraAnims: false, celebrations: true, replay: true, normalizedSizes: true, duskShadow: true, playable: false, goalNet: false, billboards: true, matchIntro: false, deadBallSequence: false, fouls: false, debugBounds: false, keeperDiveV2: false },
  actorScale: { referee: 0.95, coach: 0.95 },
  nearGoalPush: 1.42,
  crtFilter: true,
};

/**
 * Checkpoint 6 — "Matchday": v4 Broadcast plus a team+flag entrance (players walk on, referee whistles)
 * and legible dead-ball restarts (ball rolls out, banner, taker walks to the correct corner / touchline /
 * goal-area spot and puts it back in play).
 */
export const REAL_GK_V5_CONFIG: RealGkConfig = {
  fieldScale: 1.5,
  spriteMinH: 26,
  spriteMaxH: 44,
  ballScale: 0.62,
  presets: [
    { label: 'Broadcast', zoom: 1.7, follow: true },
    { label: 'Close', zoom: 2.2, follow: true },
    { label: 'Wide', zoom: 1.3, follow: true },
    { label: 'Full pitch', zoom: 0.7, follow: false },
  ],
  cinematic: true,
  features: { extraAnims: true, celebrations: true, replay: true, normalizedSizes: true, duskShadow: true, playable: false, goalNet: false, billboards: true, matchIntro: true, deadBallSequence: true, fouls: true, debugBounds: false, keeperDiveV2: false },
  actorScale: { referee: 0.95, coach: 0.95 },
  nearGoalPush: 1.42,
  teams: {
    blue: { name: 'France', flagId: 'france', colors: ['#0055A4', '#FFFFFF', '#EF4135'] },
    red: { name: 'Spain', flagId: 'spain', colors: ['#AA151B', '#F1BF00', '#AA151B'] },
  },
};

/**
 * Checkpoint 7 — "Reflex": Matchday plus the new keeper dive pack (candidate_01) — crouch anticipation,
 * a smeared ghost-trail launch (the approved save effect), prone slide and kneel recovery.
 */
export const REAL_GK_V6_CONFIG: RealGkConfig = {
  ...REAL_GK_V5_CONFIG,
  features: { ...(REAL_GK_V5_CONFIG.features as RealGkFeatures), keeperDiveV2: true },
};

/**
 * Persona casting match — the Full Match look/behaviour, but every outfield player is rendered as a
 * headless body + composited persona head (distinct characters), instead of one baked face.
 */
export const REAL_GK_PERSONAS_CONFIG: RealGkConfig = {
  ...REAL_GK_MATCH_CONFIG,
  // Hero match script/bounds/lighting, but persona-cast + an animated strike (regen shot body) and the
  // ball dust/impact effects from the Effects Lab. Smaller actors than the hero so the composited
  // persona heads read cleaner on the pitch. Wider pitch so the shape spreads like a real match.
  fieldScale: 1.85,
  spriteMinH: 23,
  spriteMaxH: 38,
  // Players shrank (composited head reads at the base height), so bump the referee/coach whole-sprites to match.
  actorScale: { referee: 1.3, coach: 1.3 },
  // Frame the action higher, nearer the far-touchline billboards (telões).
  cameraLift: 0.12,
  // celebrations OFF: goals keep the freeze + replay flow, but skip the arms-up run / jump routine.
  // Keeper stays on the compact pack end-to-end (idle/walk/dive share the compact outfit) — no keeperDiveSave.
  // deadBallSequence: staged restarts (ball rolls out, taker walks over) — also what keeps the DRIVEN
  // ball from ever snapping on out-of-play; drivenFiller keeps the 90' watch alive between feed events.
  features: { ...(REAL_GK_MATCH_CONFIG.features as RealGkFeatures), personaHeads: true, personaShot: true, ballEffects: true, slideTackles: true, livelyMatch: true, celebrations: false, deadBallSequence: true, drivenFiller: true, matchStructure: true },
  // Mock matchup so scoreboards/goal overlay show real names + flags instead of generic Blue/Red.
  teams: {
    blue: { name: 'Brazil', flagId: 'brazil', colors: ['#009C3B', '#FFDF00', '#002776'] },
    red: { name: 'Argentina', flagId: 'argentina', colors: ['#75AADB', '#FFFFFF', '#75AADB'] },
  },
};

/**
 * Playable persona sandbox — the Playable config (control your teammates, pass/shoot with the ball) with
 * persona casting on, so the players you drive wear distinct persona heads. `extraAnims` is turned on so
 * the shot plays its animated power-shot wind-up (composited over the persona head) instead of an instant
 * strike, and header/trap (C / V / B) become available.
 */
export const REAL_GK_PERSONA_PLAY_CONFIG: RealGkConfig = {
  ...REAL_GK_PLAY_CONFIG,
  spriteMinH: 23,
  spriteMaxH: 38,
  actorScale: { referee: 1.3, coach: 1.3 },
  cameraLift: 0.12,
  features: { ...(REAL_GK_PLAY_CONFIG.features as RealGkFeatures), extraAnims: true, personaHeads: true, personaShot: true, ballEffects: true, slideTackles: true },
  teams: {
    blue: { name: 'Brazil', flagId: 'brazil', colors: ['#009C3B', '#FFDF00', '#002776'] },
    red: { name: 'Argentina', flagId: 'argentina', colors: ['#75AADB', '#FFFFFF', '#75AADB'] },
  },
};

/** France kit review sandbox - playable persona arena using the approved France body cuts. */
export const REAL_GK_FRANCE_PLAY_CONFIG: RealGkConfig = {
  ...REAL_GK_PERSONA_PLAY_CONFIG,
  personaBodyRoot: '/game/franca',
  personaHeadScale: 0.82,
  playableRoster: 1,
  teams: {
    blue: { name: 'France', flagId: 'france', colors: ['#0055A4', '#FFFFFF', '#EF4135'] },
    red: { name: 'France', flagId: 'france', colors: ['#0055A4', '#FFFFFF', '#EF4135'] },
  },
};

/** Resolves the variant config for a RealGk checkpoint id (defaults to v2). */
export function realGkConfigFor(id: CheckpointId): RealGkConfig {
  if (id === CheckpointId.RealGkPersonaPlay) return REAL_GK_PERSONA_PLAY_CONFIG;
  if (id === CheckpointId.RealGkPersonas) return REAL_GK_PERSONAS_CONFIG;
  if (id === CheckpointId.EffectsLab) return EFFECTS_LAB_CONFIG;
  if (id === CheckpointId.RealGkV6) return REAL_GK_V6_CONFIG;
  if (id === CheckpointId.RealGkMatch) return REAL_GK_MATCH_CONFIG;
  if (id === CheckpointId.RealGkSolo) return REAL_GK_SOLO_CONFIG;
  if (id === CheckpointId.RealGkPlay) return REAL_GK_PLAY_CONFIG;
  if (id === CheckpointId.RealGkV5) return REAL_GK_V5_CONFIG;
  if (id === CheckpointId.RealGkV4) return REAL_GK_V4_CONFIG;
  return id === CheckpointId.RealGkV3 ? REAL_GK_CINEMA_CONFIG : REAL_GK_V2_CONFIG;
}
