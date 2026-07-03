import { TIME_SCALE } from '../constants';
import type { RealGkConfig } from '../config';
import { MatchPhase, RefMode, RefPhase, Role, Team } from '../enums';
import { pointOnField } from '../field';
import type { Ball, MatchState, RealGkWorld, Referee, Size } from '../types';
import { updateBall } from './ball';
import { clearCelebrations } from './celebration';
import { freshCoach, resetCoach, updateCoach } from './coach';
import { BallText, Status } from './messages';
import { faceBall, resetPlayers, updatePlayers } from './players';
import { resetReferee, updateReferee } from './referee';
import { setStatus } from './rules';

const freshBall = (): Ball => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, spinRate: 0, ownerId: null, cooldown: 0, impact: 0, lastKickerId: null });

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
});

/** Drops the ball at center and gives it to the kickoff team's most central outfielder. */
export function resetBall(world: RealGkWorld, centerTeam: Team): void {
  const { ball, players, size } = world;
  const center = pointOnField(size, 0.5, 0.5);
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

export function restartMatch(world: RealGkWorld): void {
  world.match.blue = 0;
  world.match.red = 0;
  world.match.time = 0;
  world.match.celebration = 0;
  world.match.kickoffTeam = Team.Blue;
  world.match.ballText = BallText.loose;
  world.match.phase = MatchPhase.Live;
  world.match.phaseTimer = 0;
  world.match.celebrantId = null;
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
    referee: freshReferee(),
    coach: freshCoach(),
    match: freshMatch(),
    size: { width: view.width * cfg.fieldScale, height: view.height * cfg.fieldScale },
    view,
    cfg,
    dpr: 1,
  };
  restartMatch(world);
  return world;
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

  match.time += dt * TIME_SCALE;
  updatePlayers(world, dt);
  updateBall(world, dt);
  faceBall(world);
  updateReferee(world, dt);
  updateCoach(world, dt);
}
