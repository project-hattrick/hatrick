import { DecisionKind, isKeeper, moveToward, ownerDecision, updateOffBall } from './ai';
import { loadAssets } from './assets';
import {
  createEffects,
  slowMoScale,
  spawnBounceDust,
  spawnKickDust,
  spawnShotPulse,
  spawnSkidDust,
  triggerSlowMo,
  updateEffects,
} from './effects';
import { pitchRect, renderScene } from './render';
import {
  FORMATION,
  FxKind,
  GOAL_BOTTOM,
  GOAL_TOP,
  HeadView,
  TEAM_COLOR,
  TEAM_NAME,
  TUNING,
  Team,
  clamp,
  facingFrom,
  facingVector,
  len,
  rand,
  type Ball,
  type GameState,
  type InputState,
  type Player,
} from './types';

export interface HeadsOnlyHandle {
  restart: () => void;
  togglePause: () => void;
  resize: () => void;
  destroy: () => void;
}

const KEY_MAP: Record<string, keyof InputState | undefined> = {
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right',
};

const SKID_MIN_SPEED = 0.12;

function seed(team: Team, id: number, personaId: number, jersey: number, x: number, y: number): Player {
  return {
    id,
    team,
    personaId,
    jersey,
    x,
    y,
    vx: 0,
    vy: 0,
    homeX: x,
    homeY: y,
    view: HeadView.Side,
    flip: team === Team.Red,
    bob: (personaId % 7) * 0.9,
    speed: 0,
    aimX: x,
    aimY: y,
    decideAt: 0,
    runX: 0,
    runY: 0,
    runUntil: 0,
    skidCd: 0,
    lastDirX: 0,
  };
}

/** Both 11-player squads from the shared formation (red mirrored), homes jittered per kickoff. */
function makePlayers(): Player[] {
  const list: Player[] = [];
  FORMATION.forEach((slot, i) => {
    const keeper = i === 0;
    const jx = keeper ? 0 : rand(-0.015, 0.015);
    const jy = keeper ? 0 : rand(-0.015, 0.015);
    list.push(seed(Team.Blue, i + 1, i, slot.jersey, slot.x + jx, slot.y + jy));
    list.push(seed(Team.Red, i + 12, i, slot.jersey, 1 - slot.x - jx, slot.y + jy));
  });
  return list;
}

function resetBall(ownerId: number | null): Ball {
  return { x: 0.5, y: 0.5, vx: 0, vy: 0, ownerId, cooldown: 0.4, spin: 0, trail: [], lastKickerId: null };
}

function nearest(players: Player[], x: number, y: number, test: (p: Player) => boolean): Player | null {
  let pick: Player | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const p of players) {
    if (!test(p)) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < best) {
      pick = p;
      best = d;
    }
  }
  return pick;
}

export function createHeadsOnlyEngine(canvas: HTMLCanvasElement): HeadsOnlyHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;

  const assets = loadAssets();
  const input: InputState = { up: false, down: false, left: false, right: false };

  const state: GameState = {
    players: makePlayers(),
    ball: resetBall(1),
    fx: [],
    effects: createEffects(),
    events: [],
    scoreBlue: 0,
    scoreRed: 0,
    clock: 0,
    time: 0,
    possBlue: 0,
    possRed: 0,
    controlledId: 1,
    passTargetId: null,
    goalBanner: null,
    shake: 0,
  };
  let paused = false;
  let raf = 0;
  let lastT = performance.now();

  const resize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round((canvas.clientWidth || 800) * dpr);
    canvas.height = Math.round((canvas.clientHeight || 600) * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  };

  const event = (text: string, color: string): void => {
    state.events.push({ text, color, t: 0, life: 2.2 });
    if (state.events.length > 4) state.events.shift();
  };

  const spawnFx = (kind: FxKind, x: number, y: number, color: string, spread = 0): void => {
    const ang = Math.random() * Math.PI * 2;
    state.fx.push({
      kind,
      x,
      y,
      vx: Math.cos(ang) * spread,
      vy: Math.sin(ang) * spread,
      t: 0,
      life: kind === FxKind.Spark ? 0.7 : 0.45,
      color,
    });
  };

  const owner = (): Player | undefined => state.players.find((p) => p.id === state.ball.ownerId);

  const releaseBall = (from: Player, speed: number, tx: number, ty: number): void => {
    const dx = tx - from.x;
    const dy = ty - from.y;
    const d = len(dx, dy);
    state.ball.ownerId = null;
    state.ball.lastKickerId = from.id;
    state.ball.cooldown = 0.22;
    state.ball.x = from.x + (dx / d) * 0.03;
    state.ball.y = from.y + (dy / d) * 0.03;
    state.ball.vx = (dx / d) * speed;
    state.ball.vy = (dy / d) * speed;
    spawnFx(FxKind.Ring, from.x, from.y, TEAM_COLOR[from.team]);
    spawnKickDust(state.effects, from.x, from.y, dx / d, dy / d, clamp(speed / TUNING.shootSpeed, 0.4, 1));
  };

  const doPass = (from: Player, mate: Player): void => {
    const d = Math.hypot(mate.x - from.x, mate.y - from.y);
    const lead = (d / TUNING.passSpeed) * 0.55;
    const tx = clamp(mate.x + mate.vx * lead + rand(-0.01, 0.01), 0.02, 0.98);
    const ty = clamp(mate.y + mate.vy * lead + rand(-0.01, 0.01), 0.05, 0.95);
    releaseBall(from, TUNING.passSpeed * rand(0.9, 1.1), tx, ty);
    state.passTargetId = mate.id;
  };

  const doShoot = (from: Player): void => {
    const gx = from.team === Team.Blue ? 1.03 : -0.03;
    let aimY = rand(GOAL_TOP + 0.025, GOAL_BOTTOM - 0.025);
    if (Math.random() < 0.16) aimY += (Math.random() < 0.5 ? -1 : 1) * rand(0.06, 0.12); // off target
    releaseBall(from, TUNING.shootSpeed * rand(0.92, 1.05), gx, aimY);
    state.passTargetId = null;
    spawnShotPulse(state.effects, state.ball.x, state.ball.y, Math.atan2(aimY - from.y, gx - from.x), 1);
    triggerSlowMo(state.effects);
    state.shake = Math.max(state.shake, 0.3);
    event(`${TEAM_NAME[from.team]} ${from.jersey} SHOOTS!`, TEAM_COLOR[from.team]);
  };

  const doClear = (keeper: Player, target: Player | undefined, tx: number, ty: number): void => {
    if (target) doPass(keeper, target);
    else releaseBall(keeper, TUNING.passSpeed * 1.2, tx, ty);
  };

  const kickoff = (concedingTeam: Team): void => {
    state.players = makePlayers();
    const taker = state.players.find((p) => p.team === concedingTeam && p.jersey === 9);
    state.ball = resetBall(taker ? taker.id : concedingTeam === Team.Blue ? 1 : 12);
    state.passTargetId = null;
    if (taker) taker.decideAt = state.time + rand(0.5, 0.9);
  };

  const goal = (scoringTeam: Team): void => {
    if (scoringTeam === Team.Blue) state.scoreBlue += 1;
    else state.scoreRed += 1;
    state.goalBanner = { t: 0, team: scoringTeam };
    state.shake = 1;
    const cx = scoringTeam === Team.Blue ? 0.99 : 0.01;
    for (let i = 0; i < 18; i++) spawnFx(FxKind.Spark, cx, 0.5, TEAM_COLOR[scoringTeam], 0.3);
    kickoff(scoringTeam === Team.Blue ? Team.Red : Team.Blue);
  };

  /** A missed byline shot restarts from the defending keeper instead of bouncing back. */
  const goalKick = (keeperTeam: Team): void => {
    const gk = state.players.find((p) => p.team === keeperTeam && isKeeper(p));
    if (!gk) return;
    state.ball.ownerId = gk.id;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.trail.length = 0;
    state.passTargetId = null;
    gk.decideAt = state.time + rand(0.5, 0.9);
    event(`GOAL KICK — ${TEAM_NAME[keeperTeam]}`, TEAM_COLOR[keeperTeam]);
  };

  const pickControlled = (): void => {
    const o = owner();
    if (o && o.team === Team.Blue) {
      state.controlledId = o.id;
      return;
    }
    const nearestBlue = nearest(state.players, state.ball.x, state.ball.y, (p) => p.team === Team.Blue && !isKeeper(p));
    state.controlledId = nearestBlue ? nearestBlue.id : null;
  };

  const updateControlled = (p: Player, dt: number): void => {
    const ix = Number(input.right) - Number(input.left);
    const iy = Number(input.down) - Number(input.up);
    if (ix || iy) {
      const l = len(ix, iy);
      p.vx = (ix / l) * TUNING.playerSpeed;
      p.vy = (iy / l) * TUNING.playerSpeed;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.speed = TUNING.playerSpeed;
      const f = facingFrom(p.vx, p.vy, p);
      p.view = f.view;
      p.flip = f.flip;
    } else {
      p.vx = 0;
      p.vy = 0;
      p.speed = 0;
    }
  };

  /** AI owner: dribble toward the current aim between randomized decisions. */
  const updateOwner = (p: Player, dt: number): void => {
    if (state.time >= p.decideAt) {
      const d = ownerDecision(state, p);
      if (d.kind === DecisionKind.Pass && d.target) doPass(p, d.target);
      else if (d.kind === DecisionKind.Shoot) doShoot(p);
      else if (d.kind === DecisionKind.Clear) doClear(p, d.target, d.tx, d.ty);
      else {
        p.aimX = d.tx;
        p.aimY = d.ty;
      }
      p.decideAt = state.time + rand(0.35, 0.85);
      return;
    }
    moveToward(p, p.aimX, p.aimY, TUNING.aiDribbleSpeed, dt);
    if (Math.hypot(p.aimX - p.x, p.aimY - p.y) < 0.015) p.decideAt = state.time;
  };

  const teamChaserId = (team: Team): number | null => {
    const c = nearest(state.players, state.ball.x, state.ball.y, (p) => p.team === team && !isKeeper(p));
    return c ? c.id : null;
  };

  const updatePlayers = (dt: number): void => {
    const blueChaser = teamChaserId(Team.Blue);
    const redChaser = teamChaserId(Team.Red);
    for (const p of state.players) {
      if (p.id === state.controlledId) updateControlled(p, dt);
      else if (state.ball.ownerId === p.id) updateOwner(p, dt);
      else updateOffBall(state, p, p.id === (p.team === Team.Blue ? blueChaser : redChaser), dt);

      // Skid dust on a hard horizontal reversal at speed.
      const dirX = p.vx > 0.02 ? 1 : p.vx < -0.02 ? -1 : 0;
      p.skidCd = Math.max(0, p.skidCd - dt);
      if (dirX !== 0 && p.lastDirX !== 0 && dirX !== p.lastDirX && p.speed > SKID_MIN_SPEED && p.skidCd <= 0) {
        spawnSkidDust(state.effects, p.x, p.y, dirX);
        p.skidCd = 0.7;
      }
      if (dirX !== 0) p.lastDirX = dirX;

      p.x = clamp(p.x, 0.02, 0.98);
      p.y = clamp(p.y, 0.05, 0.95);
      p.bob += (p.speed > 0.02 ? 10 : 2.4) * dt + 0.0001;
    }
  };

  const tackle = (dt: number): void => {
    const o = owner();
    if (!o) return;
    const opp = nearest(state.players, o.x, o.y, (p) => p.team !== o.team && !isKeeper(p));
    if (opp && Math.hypot(opp.x - o.x, opp.y - o.y) < 0.03 && Math.random() < 1.7 * dt) {
      state.ball.ownerId = opp.id;
      state.passTargetId = null;
      opp.decideAt = state.time + rand(0.25, 0.5);
      opp.aimX = opp.x;
      opp.aimY = opp.y;
      spawnFx(FxKind.Spark, o.x, o.y, TEAM_COLOR[opp.team], 0.12);
      spawnSkidDust(state.effects, o.x, o.y, opp.flip ? -1 : 1);
      event(`STEAL — ${TEAM_NAME[opp.team]} ${opp.jersey}`, TEAM_COLOR[opp.team]);
    }
  };

  const claimBall = (): void => {
    const ball = state.ball;
    const speedAtClaim = Math.hypot(ball.vx, ball.vy);
    const taker = nearest(
      state.players,
      ball.x,
      ball.y,
      (p) => Math.hypot(p.x - ball.x, p.y - ball.y) < (isKeeper(p) ? 0.05 : 0.038),
    );
    if (!taker) return;
    const kicker = state.players.find((p) => p.id === ball.lastKickerId);
    const opposed = kicker && kicker.team !== taker.team;
    if (opposed && isKeeper(taker) && speedAtClaim > 0.5) {
      event(`SAVE! ${TEAM_NAME[taker.team]} 1`, TEAM_COLOR[taker.team]);
      state.shake = Math.max(state.shake, 0.18);
    } else if (opposed && state.passTargetId !== null) {
      event(`INTERCEPTED — ${TEAM_NAME[taker.team]} ${taker.jersey}`, TEAM_COLOR[taker.team]);
    }
    ball.ownerId = taker.id;
    ball.trail.length = 0;
    state.passTargetId = null;
    // One-touch chance keeps combinations quick; otherwise a control touch then decide.
    taker.decideAt = state.time + (Math.random() < 0.2 ? rand(0.06, 0.16) : rand(0.3, 0.8));
    taker.aimX = taker.x;
    taker.aimY = taker.y;
  };

  const updateBall = (dt: number): void => {
    const ball = state.ball;
    const o = owner();
    if (o) {
      const v = facingVector(o.view, o.flip);
      ball.x = clamp(o.x + v.x * 0.032, 0.01, 0.99);
      ball.y = clamp(o.y + v.y * 0.04, 0.03, 0.97);
      ball.vx = 0;
      ball.vy = 0;
      ball.spin += o.speed * dt * 26;
      ball.trail.length = 0;
      tackle(dt);
      return;
    }
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    const fr = Math.pow(TUNING.frictionPerSec, dt);
    ball.vx *= fr;
    ball.vy *= fr;
    ball.cooldown = Math.max(0, ball.cooldown - dt);
    ball.spin += Math.hypot(ball.vx, ball.vy) * dt * 22;
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 10) ball.trail.shift();

    const speed = Math.hypot(ball.vx, ball.vy);
    if (ball.y < 0.03 || ball.y > 0.97) {
      ball.vy *= -0.7;
      if (speed > 0.3) spawnBounceDust(state.effects, ball.x, clamp(ball.y, 0.03, 0.97), speed);
    }
    ball.y = clamp(ball.y, 0.03, 0.97);

    const inMouth = ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM;
    if (ball.x > 1.0) {
      if (inMouth) goal(Team.Blue);
      else goalKick(Team.Red);
      return;
    }
    if (ball.x < 0) {
      if (inMouth) goal(Team.Red);
      else goalKick(Team.Blue);
      return;
    }
    if (ball.x < 0.02 || ball.x > 0.98) {
      ball.vx *= -0.62;
      if (speed > 0.3) spawnBounceDust(state.effects, clamp(ball.x, 0.02, 0.98), ball.y, speed);
    }
    ball.x = clamp(ball.x, 0.01, 0.99);

    if (ball.cooldown <= 0) claimBall();
  };

  const updateFx = (dt: number): void => {
    for (const fx of state.fx) {
      fx.t += dt;
      fx.x += fx.vx * dt;
      fx.y += fx.vy * dt;
      fx.vy += dt * 0.25;
    }
    state.fx = state.fx.filter((fx) => fx.t < fx.life);
    for (const ev of state.events) ev.t += dt;
    state.events = state.events.filter((ev) => ev.t < ev.life);
  };

  const update = (dt: number): void => {
    const sdt = dt * slowMoScale(state.effects);
    state.time += sdt;
    state.clock += sdt * TUNING.clockScale;
    state.shake = Math.max(0, state.shake - dt * 2.2);
    if (state.goalBanner) {
      state.goalBanner.t += dt;
      if (state.goalBanner.t > 1.8) state.goalBanner = null;
    }
    const o = owner();
    if (o) {
      if (o.team === Team.Blue) state.possBlue += sdt;
      else state.possRed += sdt;
    }
    pickControlled();
    updatePlayers(sdt);
    updateBall(sdt);
    updateEffects(state.effects, sdt, dt);
    updateFx(dt);
  };

  const draw = (): void => {
    const viewW = canvas.clientWidth || 800;
    const viewH = canvas.clientHeight || 600;
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    renderScene(ctx, assets, { w: viewW, h: viewH }, state);
  };

  const frame = (now: number): void => {
    const dt = Math.min(0.04, (now - lastT) / 1000);
    lastT = now;
    if (!paused) update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();
    if (k === ' ') {
      const o = owner();
      if (o && o.id === state.controlledId) {
        const mate = nearest(state.players, o.x, o.y, (p) => p.team === o.team && p.id !== o.id && !isKeeper(p));
        if (mate) doPass(o, mate);
      }
      e.preventDefault();
      return;
    }
    if (k === 'x') {
      const o = owner();
      if (o && o.id === state.controlledId) doShoot(o);
      e.preventDefault();
      return;
    }
    const key = KEY_MAP[k];
    if (key) {
      input[key] = true;
      e.preventDefault();
    }
  };

  const onKeyUp = (e: KeyboardEvent): void => {
    const key = KEY_MAP[e.key.toLowerCase()];
    if (key) input[key] = false;
  };

  /** Click anywhere on the pitch to send the ball there (when your player owns it). */
  const onPointerDown = (e: PointerEvent): void => {
    const o = owner();
    if (!o || o.id !== state.controlledId) return;
    const rect = pitchRect(canvas.clientWidth || 800, canvas.clientHeight || 600);
    const bounds = canvas.getBoundingClientRect();
    const nx = (e.clientX - bounds.left - rect.x) / rect.w;
    const ny = (e.clientY - bounds.top - rect.y) / rect.h;
    if (nx < -0.05 || nx > 1.05 || ny < -0.05 || ny > 1.05) return;
    const d = Math.hypot(nx - o.x, ny - o.y);
    releaseBall(o, clamp(TUNING.passSpeed * (0.7 + d * 1.3), 0.45, TUNING.shootSpeed), nx, ny);
    state.passTargetId = null;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  resize();
  raf = requestAnimationFrame(frame);

  return {
    restart: () => {
      state.scoreBlue = 0;
      state.scoreRed = 0;
      state.clock = 0;
      state.time = 0;
      state.possBlue = 0;
      state.possRed = 0;
      state.fx = [];
      state.events = [];
      state.effects = createEffects();
      state.goalBanner = null;
      kickoff(Team.Blue);
    },
    togglePause: () => {
      paused = !paused;
    },
    resize,
    destroy: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
    },
  };
}
