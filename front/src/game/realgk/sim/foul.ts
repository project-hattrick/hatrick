import { BodyAnim, PlayerAction, RefPhase, RestartKind, RestartStage, Role, Team } from '../enums';
import { fieldRatios, inPenaltyBox, penaltySpot, pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { ballOwner } from './ball';
import { BallText, Status } from './messages';
import { nearestPlayerToBall } from './players';
import { setStatus } from './rules';

/** Challenge distance within which a defender can commit a foul on the ball carrier. */
const CHALLENGE_DIST = 26;
/** Probability per second of a foul while a challenge is contested. */
const FOUL_CHANCE_PER_SEC = 0.55;
/** Share of fouls that draw a straight red card. */
const RED_CARD_CHANCE = 0.25;
/** Real-seconds gap between fouls, so the sanction beat stays special. */
const COOLDOWN_MIN = 16;
const COOLDOWN_SPREAD = 18;

const opposite = (t: Team): Team => (t === Team.Blue ? Team.Red : Team.Blue);

/** Referee phases during which no new foul may be called (he is already running a beat). */
const REF_BUSY = new Set<RefPhase>([RefPhase.RunCenter, RefPhase.Pause, RefPhase.Whistle, RefPhase.Card]);

/**
 * Freezes play at the foul and opens the sanction flow: the victim goes down, the referee sprints over,
 * whistles or brandishes the red card, then a free kick (with wall) or penalty (full box staging) follows.
 */
export function startFoul(
  world: RealGkWorld,
  offender: RealGkPlayer,
  victim: RealGkPlayer,
  card: boolean,
  cardColor: 'yellow' | 'red' | null = card ? 'red' : null,
): void {
  const { size, match, ball } = world;
  const inBox = inPenaltyBox(size, offender.team, victim.x, victim.y);
  const at = { x: victim.x, y: victim.y };
  const ratios = fieldRatios(size, at.x, at.y);
  const spot = inBox
    ? penaltySpot(size, offender.team)
    : pointOnField(size, clamp(ratios.lat, 0.05, 0.95), clamp(ratios.depth, 0.08, 0.92));

  // The foul owns the ball: kill it where it lies.
  ball.ownerId = null;
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  ball.z = 0;
  ball.spinRate = 0;
  ball.lofted = false;
  ball.cooldown = 1;

  // Clear every in-flight one-shot (dives, power shots…) so nobody freezes mid-pose for the stoppage.
  for (const p of world.players) {
    if (p.action !== PlayerAction.None) {
      p.action = PlayerAction.None;
      p.actionTimer = 0;
      p.actionElapsed = 0;
      p.mode = p.idleMode;
    }
  }
  // The victim goes down — the knee slide plays once and holds its on-the-ground frame.
  victim.mode = BodyAnim.KneeSlide;
  victim.actionElapsed = 0;
  victim.vx = 0;
  victim.vy = 0;

  match.restart = {
    kind: inBox ? RestartKind.Penalty : RestartKind.FreeKick,
    team: victim.team,
    stage: RestartStage.FoulFreeze,
    timer: 0,
    spot,
    takerId: null,
    foul: { offenderId: offender.id, victimId: victim.id, card, cardColor, at },
  };
  match.foulCooldown = COOLDOWN_MIN + Math.random() * COOLDOWN_SPREAD;
  match.ballText = BallText.foul;
  const note = Status.foul(offender.name, victim.name);
  setStatus(world, note.title, note.text);
}

/** Rolls a live-play foul while the carrier is being challenged. True when a foul stopped play. */
export function maybeTriggerFoul(world: RealGkWorld, dt: number): boolean {
  if (!world.cfg.features?.fouls) return false;
  const { match } = world;
  match.foulCooldown = Math.max(0, match.foulCooldown - dt);
  if (match.foulCooldown > 0 || match.restart || match.celebration > 0) return false;
  if (world.referee.active && REF_BUSY.has(world.referee.phase)) return false;
  const owner = ballOwner(world);
  if (!owner || owner.role === Role.GK) return false;
  const chaser = nearestPlayerToBall(world, opposite(owner.team));
  if (!chaser || chaser.role === Role.GK) return false;
  if (Math.hypot(chaser.x - owner.x, chaser.y - owner.y) > CHALLENGE_DIST) return false;
  if (Math.random() > FOUL_CHANCE_PER_SEC * dt) return false;
  startFoul(world, chaser, owner, Math.random() < RED_CARD_CHANCE);
  return true;
}

/** Holds the frozen foul scene: everyone stops, the victim stays down, the ball stays dead. */
export function holdFoulScene(world: RealGkWorld, dt: number): void {
  const r = world.match.restart;
  if (!r?.foul) return;
  for (const p of world.players) {
    p.vx = 0;
    p.vy = 0;
    if (p.id === r.foul.victimId) {
      p.mode = BodyAnim.KneeSlide;
      p.actionElapsed += dt; // plays the fall once, then frameIndexFor holds the last (grounded) frame
      continue;
    }
    if (p.mode !== p.idleMode && p.action === PlayerAction.None) p.mode = p.idleMode;
  }
  const { ball } = world;
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  ball.z = 0;
}
