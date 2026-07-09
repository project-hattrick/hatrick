import { TIME_SCALE } from '../constants';
import type { RealGkConfig } from '../config';
import { IntroStage, MatchPhase, RefMode, RefPhase, Role, ShotEffectStyle, Team } from '../enums';
import { clearBallEffects, updateBallEffects } from '../effects';
import { centerSpot } from '../field';
import type { Ball, MatchState, RealGkWorld, Referee, Size } from '../types';
import { updateBall } from './ball';
import { clearCelebrations } from './celebration';
import { freshDrivenClock, tickDrivenClock } from './driven-clock';
import { armFiller, tickFiller } from './filler';
import { freshCoach, resetCoach, updateCoach } from './coach';
import { maybeTriggerFoul } from './foul';
import { updateIntro } from './intro';
import { BallText, Status } from './messages';
import { faceBall, placePlayersOffPitch, resetPlayers, updatePlayers } from './players';
import { resetReferee, updateReferee } from './referee';
import { updateRestart } from './restart';
import { setStatus } from './rules';

const freshBall = (): Ball => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, spinRate: 0, ownerId: null, cooldown: 0, impact: 0, lastKickerId: null, lofted: false, landX: 0, landY: 0 });

const freshReferee = (): Referee => ({
  active: true,
  x: 0,
  y: 0,
  startX: 0,
  startY: 0,
  targetX: 0,
  targetY: 0,
  mode: RefMode.WalkSide,
  phase: RefPhase.Patrol,
  elapsed: 0,
  mirror: false,
  patrolLeftX: 0,
  patrolRightX: 0,
  patrolY: 0,
  patrolDir: 1,
  patrolPause: 0,
  nextPatrolPause: 0,
  homeX: 0,
  homeY: 0,
  kickoff: false,
  whistleOnly: false,
  runSpeed: 124,
});

const freshMatch = (): MatchState => ({
  blue: 0,
  red: 0,
  time: 0,
  celebration: 0,
  kickoffTeam: Team.Blue,
  statusTitle: '',
  statusText: '',
  ballText: BallText.loose,
  phase: MatchPhase.Live,
  phaseTimer: 0,
  celebrantId: null,
  scorer: null,
  introStage: IntroStage.Showcase,
  introTimer: 0,
  introHold: false,
  restart: null,
  foulCooldown: 12,
});

/** Drops the ball at center and gives it to the kickoff team's most central outfielder. */
export function resetBall(world: RealGkWorld, centerTeam: Team): void {
  const { ball, players, size } = world;
  const center = centerSpot(size);
  ball.x = center.x;
  ball.y = center.y;
  ball.z = 0;
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  ball.spin = 0;
  ball.spinRate = 0;
  ball.cooldown = 0.25;
  ball.impact = 0;
  clearBallEffects(world);
  ball.ownerId = null;
  ball.lastKickerId = null;

  const candidates = players.filter((p) => p.team === centerTeam && p.role !== Role.GK);
  if (candidates.length) {
    const owner = candidates.reduce((best, p) => (Math.abs(p.homeLat - 0.5) < Math.abs(best.homeLat - 0.5) ? p : best));
    owner.x = center.x - owner.dir * 18;
    owner.y = center.y;
    ball.ownerId = owner.id;
  }
}

/** Parks the ball dead at center with no owner — used while the v5 intro entrance plays out. */
function parkBallCenter(world: RealGkWorld): void {
  const { ball, size } = world;
  const c = centerSpot(size);
  ball.x = c.x;
  ball.y = c.y;
  ball.z = 0;
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  ball.spin = 0;
  ball.spinRate = 0;
  ball.cooldown = 0;
  ball.impact = 0;
  ball.ownerId = null;
  ball.lastKickerId = null;
  ball.lofted = false;
}

/** v5: opens the match on the entrance sequence (teams walk on, referee whistles), then kicks off. */
export function enterIntro(world: RealGkWorld): void {
  resetPlayers(world);
  placePlayersOffPitch(world);
  parkBallCenter(world);
  resetReferee(world);
  resetCoach(world);
  world.match.phase = MatchPhase.Intro;
  world.match.introStage = IntroStage.Showcase;
  world.match.introTimer = 0;
  world.match.introHold = false;
  world.match.celebration = 0;
  world.match.restart = null;
  const note = Status.intro();
  setStatus(world, note.title, note.text);
}

export function restartMatch(world: RealGkWorld): void {
  world.match.blue = 0;
  world.match.red = 0;
  world.match.time = 0;
  world.match.celebration = 0;
  world.match.kickoffTeam = Team.Blue;
  world.match.ballText = BallText.loose;
  world.match.phaseTimer = 0;
  world.match.celebrantId = null;
  world.match.restart = null;
  world.match.foulCooldown = 12;
  world.sentOffNames = [];
  if (world.cfg.features?.matchIntro) {
    enterIntro(world);
    return;
  }
  world.match.phase = MatchPhase.Live;
  resetPlayers(world);
  resetBall(world, Team.Blue);
  resetReferee(world);
  resetCoach(world);
  const note = Status.kickoff();
  setStatus(world, note.title, note.text);
}

export function createWorld(view: Size, cfg: RealGkConfig): RealGkWorld {
  const world: RealGkWorld = {
    players: [],
    nextPlayerId: 1,
    ball: freshBall(),
    ballEffects: { particles: [], shots: [], shotStyle: ShotEffectStyle.PowerArc, slowMoTimer: 0 },
    referee: freshReferee(),
    coach: freshCoach(),
    match: freshMatch(),
    size: { width: view.width * cfg.fieldScale, height: view.height * cfg.fieldScale },
    view,
    cfg,
    dpr: 1,
    controlId: 0,
    sentOffNames: [],
    driven: false,
    intent: { attackingTeam: null, threat: 0 },
    drivenClock: null,
    possessionGrant: null,
    fillerShotCooldown: 0,
    pendingDirectives: [],
  };
  restartMatch(world);
  return world;
}

/**
 * Enters feed-driven mode with a clean live kickoff: clears the intent + score and resets to a fresh
 * kickoff (Blue centre). Called by the handle's `setDriven(true)`. Leaves `world.driven` to the caller.
 */
export function enterDrivenKickoff(world: RealGkWorld): void {
  world.intent = { attackingTeam: null, threat: 0 };
  world.match.blue = 0;
  world.match.red = 0;
  world.match.time = 0;
  world.drivenClock = freshDrivenClock();
  world.possessionGrant = null;
  world.pendingDirectives = [];
  armFiller(world);
  world.match.celebration = 0;
  world.match.celebrantId = null;
  world.match.scorer = null;
  world.match.restart = null;
  world.match.phase = MatchPhase.Live;
  world.match.kickoffTeam = Team.Blue;
  clearCelebrations(world);
  resetPlayers(world);
  resetBall(world, Team.Blue);
  resetReferee(world);
  resetCoach(world);
  const note = Status.kickoff();
  setStatus(world, note.title, note.text);
}

/** Kickoff reset after a goal: fresh formations, ball at center, restart status. Leaves `phase` to the caller. */
export function kickoffReset(world: RealGkWorld): void {
  resetPlayers(world);
  resetBall(world, world.match.kickoffTeam);
  clearCelebrations(world);
  const note = Status.restart();
  setStatus(world, note.title, note.text);
}

/** Advances the whole simulation by `dt` seconds (already scaled by speed). */
export function step(world: RealGkWorld, dt: number): void {
  const { match } = world;
  updateBallEffects(world, dt);
  // v5 pre-match entrance owns the tick until it kicks off.
  if (match.phase === MatchPhase.Intro) {
    updateIntro(world, dt);
    return;
  }
  // v5 dead-ball restart: the ball rolls out, a taker sets up and puts it back in play.
  if (match.restart) {
    updateRestart(world, dt);
    return;
  }
  if (match.celebration > 0) {
    match.celebration = Math.max(0, match.celebration - dt);
    updatePlayers(world, dt);
    faceBall(world);
    updateReferee(world, dt);
    updateCoach(world, dt);
    if (match.celebration === 0) {
      if (world.cfg.features?.replay) {
        // Hand off to the replay director: it wipes to the slow-mo replay, then performs the kickoff reset.
        match.phase = MatchPhase.ReplayIn;
        match.phaseTimer = 0;
        return;
      }
      kickoffReset(world);
    }
    return;
  }

  // Red card stops the match: players/ball freeze while the referee finishes brandishing the card.
  if (world.referee.active && world.referee.phase === RefPhase.Card) {
    updateReferee(world, dt);
    updateCoach(world, dt);
    return;
  }

  // Driven mode: the clock follows the feed minute (players keep animating at 1×); attract keeps TIME_SCALE.
  if (world.driven) tickDrivenClock(world, dt);
  else match.time += dt * TIME_SCALE;
  // Feed-driven mode: the pressing team's threat decays over ~7s so a stale event doesn't pin the shape.
  if (world.intent.threat > 0) world.intent.threat *= Math.exp(-(dt * TIME_SCALE) / 7);
  // Possession-grant window (driven): the feed's intended receivers keep priority while it lasts.
  if (world.possessionGrant) {
    world.possessionGrant.timer -= dt;
    if (world.possessionGrant.timer <= 0) world.possessionGrant = null;
  }
  tickFiller(world, dt);
  // v5 fouls: a contested challenge may stop play — the sanction flow runs via updateRestart next tick.
  // Suppressed while driven: cards come from the feed via injectCard, not the autonomous challenge AI.
  if (!world.driven && maybeTriggerFoul(world, dt)) return;
  updatePlayers(world, dt);
  updateBall(world, dt);
  faceBall(world);
  updateReferee(world, dt);
  updateCoach(world, dt);
}
