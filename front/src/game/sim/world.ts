import { FIELD } from '../core/constants';
import type { Ball, Player, SimConfig, World } from '../core/types';
import { Phase, Role, Team } from '../enums';
import { clamp, dist, moveTo, nearest } from '../math/geometry';
import { MatchEvent } from './events';
import { goalkeeperStep } from './goalkeeper-ai';
import { outfieldStep } from './player-ai';
import { contestBall, dribble, faceBall, integrateBall, integratePlayers, separatePlayers } from './physics';
import { setEvent } from './rules';
import { dirOf } from './teams';

const FW = FIELD.width;
const FH = FIELD.height;
const TEAMS: Team[] = [Team.Blue, Team.Red];

/** Random jitter around a normalized home position, clamped to the pitch interior. */
const jit = (v: number, a: number): number => {
  const x = v + (Math.random() * 2 - 1) * a;
  return x < 0.05 ? 0.05 : x > 0.95 ? 0.95 : x;
};

const freshBall = (): Ball => ({ x: FW / 2, y: FH / 2, vx: 0, vy: 0, r: 6, z: 0, vz: 0, roll: 0, impact: -1 });

function makePlayer(team: Team, role: Role, hx: number, hy: number): Player {
  return {
    team,
    role,
    homeX: hx,
    homeY: hy,
    x: hx,
    y: hy,
    vx: 0,
    vy: 0,
    r: role === Role.GK ? 12 : 11,
    faceX: dirOf(team),
    faceY: 0,
    phase: 0,
    introDelay: 0,
    kickUntil: -1,
    kickStart: 0,
    celUntil: -1,
    ponderUntil: -1,
    diveUntil: -1,
    diveStart: 0,
    catchUntil: -1,
    catchStart: 0,
    gkKickUntil: -1,
    gkKickStart: 0,
    holding: false,
    holdKick: 0,
    slideUntil: -1,
    slideStart: 0,
    slideCd: 0,
    lane: Math.random() * 2 - 1,
    wob: Math.random() * 6.28,
    wsp: 0.008 + Math.random() * 0.01,
    spdK: 0.82 + Math.random() * 0.34,
    aggr: 0.65 + Math.random() * 0.7,
  };
}

/** (Re)spawns both squads. `below` drops them off-pitch for the walk-in intro. */
function buildPlayers(world: World, def: SimConfig, below: boolean): void {
  const players: Player[] = [];
  for (const team of TEAMS) {
    const formation = def.formations[Math.floor(Math.random() * def.formations.length)];
    for (const [role, dx, wy] of formation) {
      const fx = team === Team.Blue ? dx : 1 - dx;
      const p = makePlayer(team, role, jit(fx, 0.02) * FW, jit(wy, 0.03) * FH);
      if (below) {
        p.x = (0.12 + Math.random() * 0.76) * FW;
        p.y = -FH * 0.06 - Math.random() * FH * 0.06;
        p.introDelay = Math.floor(Math.random() * 70);
      }
      players.push(p);
    }
  }
  world.players = players;
  world.ball = freshBall();
  world.freeBall = 18;
  world.holder = null;
  world.ballContestCd = 0;
}

export function startMatch(world: World, def: SimConfig): void {
  const skip = def.skipIntro === true;
  buildPlayers(world, def, !skip);
  world.phase = skip ? Phase.Play : Phase.Intro;
  world.introT = 0;
  world.holdStart = -1;
  world.clock = 0;
  world.lastDono = null;
  world.camTargetIdx = -1;
  world.kickoffTick = 0;
  setEvent(world, skip ? MatchEvent.Cleared : MatchEvent.TeamsEntering);
}

function kickoff(world: World, def: SimConfig): void {
  buildPlayers(world, def, false);
  world.phase = Phase.Play;
}

export function createWorld(def: SimConfig): World {
  const world: World = {
    players: [],
    ball: freshBall(),
    freeBall: 0,
    think: 0,
    scoreBlue: 0,
    scoreRed: 0,
    pausaGol: 0,
    clock: 0,
    tick: 0,
    phase: Phase.Intro,
    introT: 0,
    holdStart: -1,
    lastDono: null,
    holder: null,
    ballContestCd: 0,
    camTargetIdx: -1,
    kickoffTick: 0,
    event: '',
    eventSeq: 0,
  };
  startMatch(world, def);
  return world;
}

/** Possession with hysteresis: the current holder keeps the ball within a wider radius. */
function possession(world: World): void {
  const { players, ball, tick } = world;
  const perto = nearest(players, ball);
  let dono: Player | null = null;
  if (world.freeBall === 0 && ball.z < 7) {
    if (world.holder && dist(world.holder, ball) < world.holder.r + ball.r + 10) dono = world.holder;
    else if (perto && dist(perto, ball) < perto.r + ball.r + 5) dono = perto;
  }
  world.holder = dono;
  if (dono && dono !== world.lastDono) dono.ponderUntil = tick + 14;
  world.lastDono = dono;
}

function introStep(world: World): void {
  const { players } = world;
  world.introT++;
  let arrived = true;
  for (const p of players) {
    const dh = Math.hypot(p.homeX - p.x, p.homeY - p.y);
    if (dh < 6) {
      p.x = p.homeX;
      p.y = p.homeY;
      p.vx = 0;
      p.vy = 0;
    } else {
      arrived = false;
      if (world.introT >= p.introDelay) moveTo(p, p.homeX, p.homeY, 1.7);
      else {
        p.vx *= 0.8;
        p.vy *= 0.8;
      }
      p.x = clamp(p.x + p.vx, p.r, FW - p.r);
      p.y = clamp(p.y + p.vy, -FH * 0.12, FH * 1.22);
      p.phase += Math.hypot(p.vx, p.vy);
    }
  }
  if (arrived && world.holdStart < 0) world.holdStart = world.introT;
  if (world.holdStart >= 0 && world.introT - world.holdStart > 180) {
    world.phase = Phase.Play;
    for (const p of players) {
      p.vx = 0;
      p.vy = 0;
    }
    setEvent(world, MatchEvent.Cleared);
  }
}

function computeChasers(world: World): Record<Team, Player | null> {
  const { players, ball } = world;
  const fieldOf = (team: Team) => players.filter((p) => p.team === team && p.role !== Role.GK);
  return {
    [Team.Blue]: nearest(fieldOf(Team.Blue), ball),
    [Team.Red]: nearest(fieldOf(Team.Red), ball),
  };
}

/** Advances the whole simulation by one tick. */
export function stepWorld(world: World, def: SimConfig): void {
  world.tick++;
  if (world.kickoffTick && world.tick >= world.kickoffTick) {
    kickoff(world, def);
    world.kickoffTick = 0;
  }
  if (world.phase === Phase.Intro) {
    introStep(world);
    return;
  }
  if (world.pausaGol > 0) {
    world.pausaGol--;
    return;
  }
  if (world.freeBall > 0) world.freeBall--;
  world.clock += 1 / 60;

  possession(world);
  const chaser = computeChasers(world);
  for (const p of world.players) {
    if (p.role === Role.GK) goalkeeperStep(p, world);
    else outfieldStep(p, world, chaser);
  }

  integratePlayers(world);
  separatePlayers(world);
  contestBall(world);
  dribble(world);
  faceBall(world);
  integrateBall(world);
}
