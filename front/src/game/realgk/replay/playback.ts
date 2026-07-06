import { BodyAnim, CelebrationKind, RefPhase, ShotEffectStyle } from '../enums';
import { PERSONA_COUNT } from '../assets/manifest';
import type { Ball, Coach, RealGkPlayer, RealGkWorld, Referee } from '../types';
import { clamp, lerp } from '../util';
import type { ReplayPlayerSnap, ReplaySnapshot } from './types';

export interface ReplaySample {
  players: ReplayPlayerSnap[];
  ball: { x: number; y: number; z: number; vx: number; vy: number; spin: number; impact: number };
  referee: ReplaySnapshot['referee'];
  coach: ReplaySnapshot['coach'];
  /** Interpolated capture-clock ms — feed as `now` into render so anims replay slowed exactly. */
  replayNow: number;
}

export interface ReplayPlayback {
  durationSeconds: number;
  sample: (progressSeconds: number) => ReplaySample;
}

/** Interpolated scrubber over a snapshot slice. Continuous fields lerp; discrete fields hold. */
export function createPlayback(snapshots: ReplaySnapshot[]): ReplayPlayback | null {
  if (snapshots.length < 2) return null;
  const t0 = snapshots[0].t;
  const tEnd = snapshots[snapshots.length - 1].t;

  const sample = (progressSeconds: number): ReplaySample => {
    const replayNow = clamp(t0 + progressSeconds * 1000, t0, tEnd);
    let idx = 0;
    while (idx < snapshots.length - 2 && snapshots[idx + 1].t <= replayNow) idx++;
    const a = snapshots[idx];
    const b = snapshots[Math.min(idx + 1, snapshots.length - 1)];
    const u = b.t > a.t ? clamp((replayNow - a.t) / (b.t - a.t), 0, 1) : 0;

    const players = a.players.map((pa) => {
      const pb = b.players.find((p) => p.id === pa.id) ?? pa;
      return {
        ...pa,
        x: lerp(pa.x, pb.x, u),
        y: lerp(pa.y, pb.y, u),
        actionElapsed: lerp(pa.actionElapsed, pb.actionElapsed, u),
        celebrationLift: lerp(pa.celebrationLift, pb.celebrationLift, u),
      };
    });

    return {
      players,
      ball: {
        x: lerp(a.ball.x, b.ball.x, u),
        y: lerp(a.ball.y, b.ball.y, u),
        z: lerp(a.ball.z, b.ball.z, u),
        vx: lerp(a.ball.vx, b.ball.vx, u),
        vy: lerp(a.ball.vy, b.ball.vy, u),
        spin: a.ball.spin,
        impact: a.ball.impact,
      },
      referee: { ...a.referee, x: lerp(a.referee.x, b.referee.x, u), y: lerp(a.referee.y, b.referee.y, u), elapsed: lerp(a.referee.elapsed, b.referee.elapsed, u) },
      coach: a.coach,
      replayNow,
    };
  };

  return { durationSeconds: (tEnd - t0) / 1000, sample };
}

function playerFromSnap(snap: ReplayPlayerSnap): RealGkPlayer {
  return {
    id: snap.id,
    name: '',
    team: snap.team,
    dir: 1,
    role: snap.role,
    homeLat: 0.5,
    homeDepth: 0.5,
    x: snap.x,
    y: snap.y,
    vx: 0,
    vy: 0,
    facing: snap.facing,
    lookX: snap.facing,
    lookY: 0,
    desiredLookX: snap.facing,
    desiredLookY: 0,
    facingLock: 0,
    pendingFacing: snap.facing,
    pendingFacingTime: 0,
    targetX: snap.x,
    targetY: snap.y,
    idleMode: BodyAnim.IdleFront,
    modeLock: 0,
    mode: snap.mode,
    think: 0,
    action: snap.action,
    actionTimer: 0,
    actionElapsed: snap.actionElapsed,
    diveDir: snap.facing,
    diveStartX: snap.x,
    diveStartY: snap.y,
    saveCooldown: 0,
    celebrationKind: CelebrationKind.None,
    celebrationPhase: snap.celebrationPhase,
    celebrationTimer: 0,
    celebrationLift: snap.celebrationLift,
    brakeCooldown: 0,
    prevSpeed: 0,
    headerCooldown: 0,
    headerHit: false,
    receiveCooldown: 0,
    receiveHit: false,
    powerShotHit: false,
    slideCooldown: 0,
    slideHit: false,
    introDelay: 0,
    spawnX: snap.x,
    spawnY: snap.y,
    // Reproduce the live persona casting (createPlayer uses id % PERSONA_COUNT) so replays keep faces.
    personaId: snap.id % Math.max(1, PERSONA_COUNT),
  };
}

/** A render-ready world view of one replay sample; shares size/view/cfg/match with the live world. */
export function materializeWorld(live: RealGkWorld, sample: ReplaySample): RealGkWorld {
  const ball: Ball = {
    ...sample.ball,
    vz: 0,
    spinRate: 0,
    ownerId: null,
    cooldown: 0,
    lastKickerId: null,
    lofted: false,
    landX: 0,
    landY: 0,
  };
  const referee: Referee = {
    ...live.referee,
    active: sample.referee.active,
    x: sample.referee.x,
    y: sample.referee.y,
    mode: sample.referee.mode,
    elapsed: sample.referee.elapsed,
    mirror: sample.referee.mirror,
    phase: RefPhase.Patrol,
  };
  const coach: Coach = { ...live.coach, x: sample.coach.x, y: sample.coach.y, depth: sample.coach.depth, mode: sample.coach.mode };
  return {
    players: sample.players.map(playerFromSnap),
    nextPlayerId: live.nextPlayerId,
    ball,
    ballEffects: { particles: [], shots: [], shotStyle: ShotEffectStyle.PowerArc, slowMoTimer: 0 },
    referee,
    coach,
    match: live.match,
    size: live.size,
    view: live.view,
    cfg: live.cfg,
    dpr: live.dpr,
    controlId: live.controlId,
    sentOffNames: live.sentOffNames,
  };
}
