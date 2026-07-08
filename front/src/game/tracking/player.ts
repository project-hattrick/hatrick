import { loadAssets } from '../headsonly/assets';
import { createEffects } from '../headsonly/effects';
import { renderScene } from '../headsonly/render';
import { FORMATION, HeadView, Team, clamp, facingFrom, type GameState, type Player } from '../headsonly/types';

type Pos = [number, number];
export interface TrackingFrame {
  t: number;
  b: number[]; // [x, y, z]
  h: Pos[]; // 11 home slots (0 = GK)
  a: Pos[]; // 11 away slots
}
export interface KeyMoment {
  t: number;
  label: string;
}
export interface TrackingData {
  fps: number;
  home: string;
  away: string;
  score: [number, number];
  duration: number;
  frames: TrackingFrame[];
  keyMoments: KeyMoment[];
}

export interface TrackingPlayerHandle {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  isPlaying: () => boolean;
  seek: (t: number) => void;
  setSpeed: (mult: number) => void;
  getSpeed: () => number;
  time: () => number;
  duration: () => number;
  resize: () => void;
  destroy: () => void;
}

function seed(team: Team, id: number, personaId: number, jersey: number): Player {
  return {
    id, team, personaId, jersey,
    x: 0.5, y: 0.5, vx: 0, vy: 0, homeX: 0.5, homeY: 0.5,
    view: HeadView.Side, flip: team === Team.Red, bob: (personaId % 7) * 0.9, speed: 0,
    aimX: 0.5, aimY: 0.5, decideAt: 0, runX: 0, runY: 0, runUntil: 0, skidCd: 0, lastDirX: 0,
  };
}

function makePlayers(): Player[] {
  const list: Player[] = [];
  FORMATION.forEach((slot, i) => list.push(seed(Team.Blue, i + 1, i, slot.jersey)));
  FORMATION.forEach((slot, i) => list.push(seed(Team.Red, i + 12, i, slot.jersey)));
  return list;
}

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

/**
 * Headless replay of a real tracking match: sets the 22 players + ball straight
 * from the dataset (no AI) and paints with the shared heads renderer. Exposes a
 * transport (play/pause/seek/speed) so a UI can scrub to key moments.
 */
export function createTrackingPlayer(canvas: HTMLCanvasElement, data: TrackingData): TrackingPlayerHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;

  const assets = loadAssets();
  const players = makePlayers();
  const state: GameState = {
    players,
    ball: { x: 0.5, y: 0.5, vx: 0, vy: 0, ownerId: null, cooldown: 0, spin: 0, trail: [], lastKickerId: null },
    fx: [],
    effects: createEffects(),
    events: [],
    scoreBlue: data.score[0],
    scoreRed: data.score[1],
    clock: 0,
    time: 0,
    possBlue: 0,
    possRed: 0,
    controlledId: null,
    passTargetId: null,
    goalBanner: null,
    shake: 0,
    intent: { attackingTeam: null, threat: 0 },
    driven: true,
  };

  const frames = data.frames;
  const duration = data.duration || frames[frames.length - 1].t;
  let cursor = 0;
  let idx = 0;
  let playing = false;
  let speed = 4;
  let raf = 0;
  let lastT = performance.now();

  const resize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round((canvas.clientWidth || 800) * dpr);
    canvas.height = Math.round((canvas.clientHeight || 600) * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  };

  /** Advance/reset the bracket pointer so frames[idx].t <= cursor < frames[idx+1].t. */
  const locate = (t: number): void => {
    if (t < frames[idx].t) idx = 0; // scrubbed backwards → rescan from start
    while (idx < frames.length - 2 && frames[idx + 1].t <= t) idx++;
  };

  const applyFrame = (dt: number): void => {
    locate(cursor);
    const f0 = frames[idx];
    const f1 = frames[Math.min(idx + 1, frames.length - 1)];
    const span = f1.t - f0.t || 1;
    const frac = clamp((cursor - f0.t) / span, 0, 1);

    const place = (p: Player, arr0: Pos[], arr1: Pos[], slot: number): void => {
      const nx = lerp(arr0[slot][0], arr1[slot][0], frac);
      const ny = lerp(arr0[slot][1], arr1[slot][1], frac);
      const vx = nx - p.x;
      const vy = ny - p.y;
      const face = facingFrom(vx * 60, vy * 60, p);
      p.view = face.view;
      p.flip = face.flip;
      p.speed = clamp(Math.hypot(vx, vy) * 30, 0, 0.3);
      p.bob += (p.speed > 0.02 ? 10 : 2.4) * dt + 0.0001;
      p.x = nx;
      p.y = ny;
    };
    for (let s = 0; s < 11; s++) {
      place(players[s], f0.h, f1.h, s);
      place(players[s + 11], f0.a, f1.a, s);
    }

    const bx = lerp(f0.b[0], f1.b[0], frac);
    const by = lerp(f0.b[1], f1.b[1], frac);
    state.ball.spin += Math.hypot(bx - state.ball.x, by - state.ball.y) * 26;
    state.ball.x = bx;
    state.ball.y = by;
    state.ball.trail.push({ x: bx, y: by });
    if (state.ball.trail.length > 8) state.ball.trail.shift();
    state.clock = cursor;
  };

  const draw = (): void => {
    const viewW = canvas.clientWidth || 800;
    const viewH = canvas.clientHeight || 600;
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    renderScene(ctx, assets, { w: viewW, h: viewH }, state);
  };

  const frame = (now: number): void => {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    state.time += dt;
    if (playing) {
      cursor += dt * speed;
      if (cursor >= duration) {
        cursor = duration;
        playing = false;
      }
    }
    applyFrame(dt);
    draw();
    raf = requestAnimationFrame(frame);
  };

  resize();
  raf = requestAnimationFrame(frame);

  return {
    play: () => {
      if (cursor >= duration) cursor = 0;
      playing = true;
    },
    pause: () => {
      playing = false;
    },
    toggle: () => {
      if (cursor >= duration) cursor = 0;
      playing = !playing;
    },
    isPlaying: () => playing,
    seek: (t: number) => {
      cursor = clamp(t, 0, duration);
      state.ball.trail.length = 0;
    },
    setSpeed: (mult: number) => {
      speed = mult;
    },
    getSpeed: () => speed,
    time: () => cursor,
    duration: () => duration,
    resize,
    destroy: () => cancelAnimationFrame(raf),
  };
}
