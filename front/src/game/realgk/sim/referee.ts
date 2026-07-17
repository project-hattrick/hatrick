import { RefMode, RefPhase } from '../enums';
import { centerSpot, pointOnField } from '../field';
import type { Referee, RealGkWorld } from '../types';
import { Status } from './messages';
import { setStatus } from './rules';

export function resetReferee(world: RealGkWorld): void {
  const { referee, size } = world;
  const patrolLeft = pointOnField(size, 0.02, 0.12);
  const patrolRight = pointOnField(size, 0.98, 0.12);
  const center = pointOnField(size, 0.5, 0.24);
  referee.active = true;
  referee.mode = RefMode.WalkSide;
  referee.phase = RefPhase.Patrol;
  referee.elapsed = 0;
  referee.patrolLeftX = patrolLeft.x;
  referee.patrolRightX = patrolRight.x;
  referee.patrolY = patrolLeft.y;
  referee.startX = patrolLeft.x;
  referee.startY = patrolLeft.y;
  referee.targetX = center.x;
  referee.targetY = center.y;
  referee.homeX = center.x;
  referee.homeY = center.y;
  referee.x = patrolLeft.x;
  referee.y = patrolLeft.y;
  referee.mirror = false;
  referee.patrolDir = 1;
  referee.patrolPause = 0.75;
  referee.nextPatrolPause = 1.8 + Math.random() * 1.7;
  referee.kickoff = false;
  referee.whistleOnly = false;
  referee.runSpeed = 124;
}

export function spawnReferee(world: RealGkWorld): void {
  const { referee, size } = world;
  if (!referee.active) resetReferee(world);
  referee.startX = referee.x;
  referee.startY = referee.y;
  const center = pointOnField(size, 0.5, 0.24);
  referee.targetX = center.x;
  referee.targetY = center.y;
  referee.active = true;
  referee.mode = RefMode.WalkSide;
  referee.phase = RefPhase.RunCenter;
  referee.elapsed = 0;
  referee.patrolPause = 0;
  referee.kickoff = false;
  referee.whistleOnly = false;
  referee.runSpeed = 124;
  referee.nextPatrolPause = 1.5 + Math.random() * 1.8;
  referee.mirror = referee.targetX < referee.x;
  const note = Status.refereeCalled();
  setStatus(world, note.title, note.text);
}

/** v5 intro: the referee jogs to the center spot and blows the whistle (Pause → Whistle, no red card). */
export function spawnRefereeKickoff(world: RealGkWorld): void {
  const { referee, size } = world;
  if (!referee.active) resetReferee(world);
  referee.startX = referee.x;
  referee.startY = referee.y;
  const center = centerSpot(size);
  referee.targetX = center.x;
  referee.targetY = center.y;
  referee.active = true;
  referee.mode = RefMode.WalkSide;
  referee.phase = RefPhase.RunCenter;
  referee.elapsed = 0;
  referee.patrolPause = 0;
  referee.kickoff = true;
  referee.whistleOnly = false;
  referee.runSpeed = 124;
  referee.mirror = referee.targetX < referee.x;
}

/** v5 fouls: the referee sprints to the foul, then whistles (free kick) or brandishes the card. */
export function spawnRefereeFoul(
  world: RealGkWorld,
  x: number,
  y: number,
  card: boolean,
  _cardColor: 'yellow' | 'red' | null = card ? 'red' : null,
): void {
  const { referee } = world;
  if (!referee.active) resetReferee(world);
  referee.startX = referee.x;
  referee.startY = referee.y;
  referee.targetX = x;
  referee.targetY = y;
  referee.active = true;
  referee.mode = RefMode.WalkSide;
  referee.phase = RefPhase.RunCenter;
  referee.elapsed = 0;
  referee.patrolPause = 0;
  referee.kickoff = false;
  referee.whistleOnly = !card;
  referee.runSpeed = 190;
  referee.mirror = referee.targetX < referee.x;
}

function moveRefereeTowards(referee: Referee, tx: number, ty: number, speed: number, dt: number): boolean {
  const dx = tx - referee.x;
  const dy = ty - referee.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= Math.max(1, speed * dt)) {
    referee.x = tx;
    referee.y = ty;
    return true;
  }
  referee.x += (dx / distance) * speed * dt;
  referee.y += (dy / distance) * speed * dt;
  if (Math.abs(dx) > 1.5) referee.mirror = dx < 0;
  return false;
}

/** Referee state machine: patrol the touchline ⇄ spawn → run center → red card → return. */
export function updateReferee(world: RealGkWorld, dt: number): void {
  const { referee } = world;
  if (!referee.active) return;
  referee.elapsed += dt;

  if (referee.phase === RefPhase.Patrol) {
    if (referee.patrolPause > 0) {
      referee.phase = RefPhase.PatrolPause;
      referee.mode = RefMode.Idle;
      referee.elapsed = 0;
      return;
    }
    referee.mode = RefMode.WalkSide;
    referee.y = referee.patrolY;
    referee.x += referee.patrolDir * 52 * dt;
    if (referee.elapsed >= referee.nextPatrolPause) {
      referee.phase = RefPhase.PatrolPause;
      referee.mode = RefMode.Idle;
      referee.patrolPause = 0.45 + Math.random() * 0.8;
      referee.nextPatrolPause = 1.4 + Math.random() * 2.1;
      referee.elapsed = 0;
      if (Math.random() < 0.6) referee.mirror = !referee.mirror;
      return;
    }
    if (referee.patrolDir > 0 && referee.x >= referee.patrolRightX) {
      referee.x = referee.patrolRightX;
      referee.patrolDir = -1;
      referee.mirror = true;
      referee.phase = RefPhase.PatrolPause;
      referee.mode = RefMode.Idle;
      referee.patrolPause = 0.55 + Math.random() * 0.6;
      referee.nextPatrolPause = 1.8 + Math.random() * 1.8;
      referee.elapsed = 0;
    } else if (referee.patrolDir < 0 && referee.x <= referee.patrolLeftX) {
      referee.x = referee.patrolLeftX;
      referee.patrolDir = 1;
      referee.mirror = false;
      referee.phase = RefPhase.PatrolPause;
      referee.mode = RefMode.Idle;
      referee.patrolPause = 0.55 + Math.random() * 0.6;
      referee.nextPatrolPause = 1.8 + Math.random() * 1.8;
      referee.elapsed = 0;
    }
    return;
  }

  if (referee.phase === RefPhase.PatrolPause) {
    referee.mode = RefMode.Idle;
    referee.y = referee.patrolY;
    referee.patrolPause = Math.max(0, referee.patrolPause - dt);
    if (referee.patrolPause === 0) {
      referee.phase = RefPhase.Patrol;
      referee.elapsed = 0;
      referee.mirror = referee.patrolDir < 0;
    }
    return;
  }

  if (referee.phase === RefPhase.RunCenter) {
    referee.mode = RefMode.WalkSide;
    if (moveRefereeTowards(referee, referee.targetX, referee.targetY, referee.runSpeed, dt)) {
      referee.x = referee.targetX;
      referee.y = referee.targetY;
      referee.mode = RefMode.Idle;
      referee.phase = RefPhase.Pause;
      referee.elapsed = 0;
    }
    return;
  }

  if (referee.phase === RefPhase.Pause) {
    if (referee.elapsed >= 0.65) {
      if (referee.kickoff || referee.whistleOnly) {
        // Whistle beat instead of the red card (kickoff, or a plain foul call).
        referee.mode = RefMode.Whistle;
        referee.phase = RefPhase.Whistle;
        referee.elapsed = 0;
        if (referee.kickoff) {
          const note = Status.kickoff();
          setStatus(world, note.title, note.text);
        }
      } else {
        referee.mode = RefMode.Red;
        referee.phase = RefPhase.Card;
        referee.elapsed = 0;
        const note = Status.redCard();
        setStatus(world, note.title, note.text);
      }
    }
    return;
  }

  if (referee.phase === RefPhase.Whistle) {
    referee.mode = RefMode.Whistle;
    if (referee.elapsed >= 0.8) {
      referee.kickoff = false;
      referee.whistleOnly = false;
      referee.mode = RefMode.WalkSide;
      referee.phase = RefPhase.ReturnPatrol;
      referee.elapsed = 0;
      referee.startX = referee.x;
      referee.startY = referee.y;
      const returnLeftDist = Math.abs(referee.x - referee.patrolLeftX);
      const returnRightDist = Math.abs(referee.x - referee.patrolRightX);
      referee.targetX = returnLeftDist < returnRightDist ? referee.patrolLeftX : referee.patrolRightX;
      referee.targetY = referee.patrolY;
      referee.mirror = referee.targetX < referee.x;
    }
    return;
  }

  if (referee.phase === RefPhase.Card) {
    if (referee.elapsed >= 1.85) {
      referee.mode = RefMode.WalkSide;
      referee.phase = RefPhase.ReturnPatrol;
      referee.elapsed = 0;
      referee.startX = referee.x;
      referee.startY = referee.y;
      const returnLeftDist = Math.abs(referee.x - referee.patrolLeftX);
      const returnRightDist = Math.abs(referee.x - referee.patrolRightX);
      referee.targetX = returnLeftDist < returnRightDist ? referee.patrolLeftX : referee.patrolRightX;
      referee.targetY = referee.patrolY;
      referee.mirror = referee.targetX < referee.x;
    }
    return;
  }

  if (referee.phase === RefPhase.ReturnPatrol) {
    referee.mode = RefMode.WalkSide;
    if (moveRefereeTowards(referee, referee.targetX, referee.targetY, 92, dt)) {
      referee.x = referee.targetX;
      referee.y = referee.targetY;
      referee.phase = RefPhase.Patrol;
      referee.mode = RefMode.WalkSide;
      referee.elapsed = 0;
      referee.patrolDir = referee.x <= referee.patrolLeftX + 1 ? 1 : -1;
      referee.mirror = referee.patrolDir < 0;
      referee.patrolPause = 0.35 + Math.random() * 0.5;
      referee.nextPatrolPause = 1.5 + Math.random() * 1.8;
      const note = Status.refereePatrol();
      setStatus(world, note.title, note.text);
    }
  }
}
