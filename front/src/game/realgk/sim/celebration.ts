import { BodyAnim, CelebrationKind, CelebrationPhase, PlayerAction, Role, Team } from '../enums';
import { fieldBounds } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp, lerp } from '../util';

/** Live celebration window before the broadcast replay kicks in (v4). */
export const CELEBRATION_LIVE_SECONDS = 2.0;

/** How many nearby teammates join the scorer with the arms-up run. */
const MAX_JOINERS = 2;

/** Phase durations ported from the assets playground; Loop/KneeLoop hold until cleared. */
const PHASE_SECONDS: Partial<Record<CelebrationPhase, number>> = {
  [CelebrationPhase.Run]: 1.1,
  [CelebrationPhase.Pose]: 0.5,
  [CelebrationPhase.Jump]: 1.5,
  [CelebrationPhase.KneeEntry]: 0.54,
  [CelebrationPhase.KneeSlide]: 1.26,
  [CelebrationPhase.KneeRise]: 0.52,
  [CelebrationPhase.KneeJump]: 0.86,
};

const NEXT_PHASE: Partial<Record<CelebrationPhase, CelebrationPhase>> = {
  [CelebrationPhase.Run]: CelebrationPhase.Pose,
  [CelebrationPhase.Pose]: CelebrationPhase.Jump,
  [CelebrationPhase.Jump]: CelebrationPhase.Loop,
  [CelebrationPhase.KneeEntry]: CelebrationPhase.KneeSlide,
  [CelebrationPhase.KneeSlide]: CelebrationPhase.KneeRise,
  [CelebrationPhase.KneeRise]: CelebrationPhase.KneeJump,
  [CelebrationPhase.KneeJump]: CelebrationPhase.KneeLoop,
};

const PHASE_MODE: Partial<Record<CelebrationPhase, BodyAnim>> = {
  [CelebrationPhase.Run]: BodyAnim.ArmsUpRun,
  [CelebrationPhase.Pose]: BodyAnim.ArmsUpRun,
  [CelebrationPhase.Jump]: BodyAnim.CelebrateJump,
  [CelebrationPhase.Loop]: BodyAnim.ArmsUpRun,
  [CelebrationPhase.KneeEntry]: BodyAnim.RunFront,
  [CelebrationPhase.KneeSlide]: BodyAnim.KneeSlide,
  [CelebrationPhase.KneeRise]: BodyAnim.KneeRise,
  [CelebrationPhase.KneeJump]: BodyAnim.KneeJump,
  [CelebrationPhase.KneeLoop]: BodyAnim.IdleFront,
};

function enterPhase(player: RealGkPlayer, phase: CelebrationPhase): void {
  player.celebrationPhase = phase;
  player.celebrationTimer = PHASE_SECONDS[phase] ?? Number.POSITIVE_INFINITY;
  player.celebrationLift = 0;
  player.actionElapsed = 0;
  player.mode = PHASE_MODE[phase] ?? BodyAnim.IdleFront;
  player.modeLock = 0;
  player.vx = 0;
  player.vy = 0;
}

function beginFor(player: RealGkPlayer, kind: CelebrationKind): void {
  player.celebrationKind = kind;
  player.action = PlayerAction.Celebrate;
  player.actionTimer = 0;
  const firstPhase = kind === CelebrationKind.Knee ? CelebrationPhase.KneeEntry : CelebrationPhase.Run;
  enterPhase(player, firstPhase);
  const facingUp = firstPhase === CelebrationPhase.Run;
  player.lookX = 0;
  player.lookY = facingUp ? -1 : 1;
  player.desiredLookX = 0;
  player.desiredLookY = player.lookY;
}

/** Kicks off the goal celebration: the scorer picks a random routine, 1-2 teammates join arms-up. */
export function startCelebrations(world: RealGkWorld, scoringTeam: Team): void {
  const { ball, match } = world;
  const squad = world.players.filter((p) => p.team === scoringTeam && p.role !== Role.GK);
  if (!squad.length) return;

  const kicker = squad.find((p) => p.id === ball.lastKickerId);
  const scorer =
    kicker ??
    squad.reduce((best, p) =>
      Math.hypot(p.x - ball.x, p.y - ball.y) < Math.hypot(best.x - ball.x, best.y - ball.y) ? p : best,
    );

  const kind = Math.random() < 0.5 ? CelebrationKind.ArmsUp : CelebrationKind.Knee;
  beginFor(scorer, kind);
  match.celebrantId = scorer.id;

  squad
    .filter((p) => p.id !== scorer.id)
    .sort((a, b) => Math.hypot(a.x - scorer.x, a.y - scorer.y) - Math.hypot(b.x - scorer.x, b.y - scorer.y))
    .slice(0, MAX_JOINERS)
    .forEach((mate) => beginFor(mate, CelebrationKind.ArmsUp));
}

/** Advances one celebrating player's routine (movement, hops, phase transitions). */
export function updatePlayerCelebration(world: RealGkWorld, player: RealGkPlayer, dt: number): void {
  const phase = player.celebrationPhase;
  if (phase === CelebrationPhase.None) return;

  player.actionElapsed += dt;
  player.celebrationTimer = Math.max(0, player.celebrationTimer - dt);
  const duration = PHASE_SECONDS[phase] ?? 0;
  const progress = duration > 0 ? clamp(1 - player.celebrationTimer / duration, 0, 1) : 1;
  const depth = fieldBounds(world.size, player.y).depth;

  if (phase === CelebrationPhase.Run) {
    player.y -= lerp(126, 218, depth) * dt;
  } else if (phase === CelebrationPhase.KneeEntry) {
    player.y += lerp(126, 218, depth) * dt;
  } else if (phase === CelebrationPhase.KneeSlide) {
    const eased = 1 - Math.pow(1 - progress, 1.8);
    player.y += lerp(182, 46, eased) * dt;
  } else if (phase === CelebrationPhase.Jump) {
    const hopProgress = (player.actionElapsed % 0.3) / 0.3;
    player.celebrationLift = Math.sin(hopProgress * Math.PI) * 8;
  } else if (phase === CelebrationPhase.KneeJump) {
    player.celebrationLift = Math.sin(progress * Math.PI) * 15;
  }

  const bounds = fieldBounds(world.size, player.y);
  player.y = clamp(player.y, bounds.topY + 4, bounds.bottomY - 8);
  player.x = clamp(player.x, bounds.left + 12, bounds.right - 12);

  player.lookX = 0;
  player.lookY = phase === CelebrationPhase.Run ? -1 : 1;

  if (player.celebrationTimer === 0) {
    const next = NEXT_PHASE[phase];
    if (next) enterPhase(player, next);
  }
}

/** Resets every celebration back to inert (called at kickoff after the replay / restart). */
export function clearCelebrations(world: RealGkWorld): void {
  for (const player of world.players) {
    if (player.action === PlayerAction.Celebrate) player.action = PlayerAction.None;
    player.celebrationKind = CelebrationKind.None;
    player.celebrationPhase = CelebrationPhase.None;
    player.celebrationTimer = 0;
    player.celebrationLift = 0;
  }
  world.match.celebrantId = null;
}
