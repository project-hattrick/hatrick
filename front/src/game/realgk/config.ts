import { BillboardKind, type Billboard } from './billboards';
import type { FieldSpec } from './field';
import type { RealGkFeel } from './sim/feel';

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
  /** Render the calibrated vector goal frame (posts + crossbar + net mesh) traced in the field
   *  calibrator, following the pitch perspective. Uses GOALS[team].crossbar for the post height. */
  goalFrame?: boolean;
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
  /** Smart football AI: the team shape slides as a unit (role-based zonal shift), off-ball players make
   *  time-persistent runs, the back line loosely man-marks + presses, and the ball owner picks passes by
   *  openness (through-balls, dribble into space, sane shots). Off → the legacy support/decide path is
   *  byte-identical. Feed authority is unchanged (no new goal path in driven mode). */
  smartAI?: boolean;
  /** Full-pitch match opening: the first Live kickoff frames the whole court (zoom 0) for ~2.5s, then
   *  eases into the normal follow camera. Off → the camera starts on the follow preset as before. */
  openingFullPitch?: boolean;
}

/** A national/team brand for the v5 intro showcase (flag + name + tricolor palette). */
export type FlagId = 'france' | 'spain' | 'brazil' | 'argentina' | 'netherlands' | 'england' | 'norway' | 'switzerland';

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
  /** Real player names per side (from feed lineups), ordered starters-first, spawn slot 0..10. Unset →
   *  the generic `${TAG}-${n}` labels. Also settable live via the handle's `setRosterNames`. */
  rosterNames?: { blue?: string[]; red?: string[] };
  /** How many controllable players the playable sandbox spawns (1 = solo court test; default 2). */
  playableRoster?: number;
  /** Adds a controllable blue goalkeeper to playable sandbox variants. */
  playableGoalkeeper?: boolean;
  /** Pins keyboard control to the blue keeper: control no longer follows the ball owner, the
   *  controlled keeper never auto-dives (Q/E dive manually), and X punts instead of power-shooting. */
  keeperControl?: boolean;
  /** Drives the pinned keeper on its own (feel-comparison grid): it tracks the ball on its line,
   *  auto-dives at incoming shots and punts a caught ball — so the feel flags animate without a player. */
  keeperAutopilot?: boolean;
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
  /** Optional second body-pack root for the away team (Team.Red) — enables a home/away kit split. */
  personaBodyRootAway?: string;
  /** Optional cache-busting suffix for the away body pack. */
  assetVersionAway?: string;
  /** Optional multiplier for persona head composition. Defaults to 1. */
  personaHeadScale?: number;
  /** Cap for a composited head's height as a fraction of the actor's depth base height. Guards against
   *  per-frame headScale outliers (dive/shot poses) ballooning the head; unset = no cap. */
  headMaxFraction?: number;
  /** Floor for a composited head's height as a fraction of the actor's depth base height. Keeps heads
   *  from shrinking with short-drawn bodies (slide tackle sizeScale ~0.68); unset = no floor. */
  headMinFraction?: number;
  /** Light retro-TV overlay on the stage (faint scanlines + RGB mask + vignette). */
  crtFilter?: boolean;
  /** Optional court/stadium background image. Defaults to the shared COURT_BG. */
  courtImage?: string;
  /** Per-court field mapping (pitch trapezoid + goals/center/out-lines). Unset = v1 rain-court values. */
  field?: FieldSpec;
  /** Per-court advertiser panels (LED/image, tuned in /sandbox/billboard-editor). Unset = defaults. */
  billboards?: Billboard[];
  /** Optional cache-busting suffix for custom asset packs. */
  assetVersion?: string;
  /** Keeper-feel experiment seed (France GK sandbox). Merged over the all-off defaults; toggled live
   *  by `handle.setFeel`. Unset = every smoothing technique off (legacy behavior). */
  feel?: Partial<RealGkFeel>;
  /** Goal-replay timing overrides (per variant). `lookback` = seconds of footage before the goal,
   *  `speed` = slow-mo playback rate (higher = faster/shorter), `wipe` = TV-wipe seconds. Any unset
   *  field falls back to the cinematic defaults in replay/director.ts. Used to shorten the room replay. */
  replayTiming?: { lookback?: number; speed?: number; wipe?: number };
}

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
  features: { extraAnims: false, celebrations: true, replay: true, normalizedSizes: true, duskShadow: true, playable: false, goalNet: false, goalFrame: false, billboards: true, matchIntro: false, deadBallSequence: false, fouls: false, debugBounds: false, keeperDiveV2: false },
  actorScale: { referee: 0.95, coach: 0.95 },
  nearGoalPush: 1.42,
  crtFilter: true,
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
 * Stadium-slide-v2 court (`public/game/franca/court.png`): grass trapezoid measured from the art
 * (largest-green-component scan). Goals/center/out-lines hand-traced in
 * /sandbox/field-calibrator?court=franca (10/07). The pitch is narrower than the v1 rain-court,
 * so France sprite sizes scale down with it (~0.85×).
 */
export const FRANCE_STADIUM_FIELD: FieldSpec = {
  ratios: { topY: 0.332, bottomY: 0.729, topLeft: 0.27, topRight: 0.727, bottomLeft: 0.195, bottomRight: 0.802 },
  goals: {
    // `crossbar` (post height, image-ratio Y) drives the goalFrame render — seeded from the rain-court
    // value; retrace on the France court at /sandbox/field-calibrator?court=franca (Goal frame mode).
    blue: { lat: 0.004, depthTop: 0.353, depthBottom: 0.512, crossbar: 0.098 },
    red: { lat: 0.979, depthTop: 0.34, depthBottom: 0.506, crossbar: 0.098 },
  },
  center: { lat: 0.502, depth: 0.42 },
  playLines: { latLeft: 0.001, latRight: 0.995, depthTop: 0.01, depthBottom: 0.99 },
};

/**
 * France-court advertiser panels — seeded from the defaults (they land close to this art's far
 * touchline); retune in /sandbox/billboard-editor?court=franca and paste the export back here.
 */
export const FRANCE_BILLBOARDS: Billboard[] = [
  // Animated neon LED (left) · static black Hatrick board (centered) · animated neon LED (right).
  // Adjacent (edge-to-edge) like before, but meeting exactly at the Hatrick board's edges — no overlap.
  {
    kind: BillboardKind.Led,
    corners: [[0.3, 0.295], [0.41, 0.295], [0.41, 0.327], [0.3, 0.327]],
    text: 'TXODDS  ·  WORLD CUP 26',
    theme: 'amber',
    speed: 9,
  },
  {
    kind: BillboardKind.Image,
    corners: [[0.445, 0.295], [0.555, 0.295], [0.555, 0.327], [0.445, 0.327]],
    src: '/game/ads/hatrick.svg',
  },
  {
    kind: BillboardKind.Led,
    corners: [[0.59, 0.295], [0.7, 0.295], [0.7, 0.327], [0.59, 0.327]],
    text: 'PLAY LIVE  ·  TXLINE',
    theme: 'blue',
    speed: 9,
  },
];

/** France complete match sandbox - autonomous 11-a-side sim using the full France player + keeper pack. */
export const REAL_GK_FRANCE_COMPLETE_CONFIG: RealGkConfig = {
  ...REAL_GK_PERSONAS_CONFIG,
  personaBodyRoot: '/game/franca',
  personaHeadScale: 0.82,
  headMaxFraction: 0.44,
  headMinFraction: 0.32,
  courtImage: '/game/franca/court.png',
  assetVersion: 'france-stadium-slide-gkclean3-idleback2-20260710',
  field: FRANCE_STADIUM_FIELD,
  billboards: FRANCE_BILLBOARDS,
  // Players bumped ~1.2x (keeps the 0.65 min:max ratio) so they read closer in size to the 1.3x referee.
  spriteMinH: 24,
  spriteMaxH: 37,
  features: {
    ...(REAL_GK_PERSONAS_CONFIG.features as RealGkFeatures),
    celebrations: true,
    keeperDiveV2: true,
    matchIntro: true,
    drivenFiller: false,
    matchStructure: false,
  },
  teams: {
    blue: { name: 'France Blue', flagId: 'france', colors: ['#0055A4', '#FFFFFF', '#EF4135'] },
    red: { name: 'France Red', flagId: 'france', colors: ['#EF4135', '#FFFFFF', '#0055A4'] },
  },
};

/**
 * Home/away kit-split demo: France (blue) body pack vs the recolored Netherlands (red) pack generated by
 * `scripts/recolor-team.mjs`. Uses the size-variant 'a' geometry (the approved Bigger read). This is the
 * first config to exercise `personaBodyRootAway` — the away team draws its own recolored bodies.
 */
export const REAL_GK_FRANCE_VS_NL_CONFIG: RealGkConfig = {
  ...REAL_GK_FRANCE_COMPLETE_CONFIG,
  spriteMinH: 28,
  spriteMaxH: 43,
  headMaxFraction: 0.44,
  personaBodyRootAway: '/game/teams/netherlands',
  teams: {
    blue: { name: 'France', flagId: 'france', colors: ['#0055A4', '#FFFFFF', '#EF4135'] },
    red: { name: 'Netherlands', flagId: 'netherlands', colors: ['#F36C21', '#FFFFFF', '#F36C21'] },
  },
};

/** Recolored away packs (scripts/recolor-team.mjs) selectable in /sandbox/france-vs-netherlands via ?away=. */
export const AWAY_TEAM_PACKS: Record<string, { root: string; brand: TeamBrand; accent: string }> = {
  netherlands: { root: '/game/teams/netherlands', brand: { name: 'Netherlands', flagId: 'netherlands', colors: ['#F36C21', '#FFFFFF', '#F36C21'] }, accent: '#F36C21' },
  brazil: { root: '/game/teams/brazil', brand: { name: 'Brazil', flagId: 'brazil', colors: ['#F4D000', '#1B3FAE', '#EEF2F7'] }, accent: '#F4D000' },
  argentina: { root: '/game/teams/argentina', brand: { name: 'Argentina', flagId: 'argentina', colors: ['#84B9E3', '#0B1230', '#EEF2F7'] }, accent: '#84B9E3' },
  spain: { root: '/game/teams/spain', brand: { name: 'Spain', flagId: 'spain', colors: ['#C60B1E', '#1A2456', '#C60B1E'] }, accent: '#C60B1E' },
  norway: { root: '/game/teams/norway', brand: { name: 'Norway', flagId: 'norway', colors: ['#BA0C2F', '#FFFFFF', '#001E50'] }, accent: '#BA0C2F' },
  england: { root: '/game/teams/england', brand: { name: 'England', flagId: 'england', colors: ['#F2F4F8', '#002366', '#EEF2F7'] }, accent: '#C8102E' },
  switzerland: { root: '/game/teams/switzerland', brand: { name: 'Switzerland', flagId: 'switzerland', colors: ['#D52B1E', '#FFFFFF', '#D52B1E'] }, accent: '#D52B1E' },
};

