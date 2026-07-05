import { MAX_DT } from './constants';
import { REAL_GK_V2_CONFIG, type RealGkConfig } from './config';
import { loadRealGkAssets } from './assets/loader';
import { drawBroadcastWipe, drawReplayDressing } from './broadcast';
import { cameraLabel, createCamera, cyclePreset, cycleTarget, triggerRefereeFocus, updateCamera, updateIntroCamera } from './camera';
import { MatchPhase, RefPhase, RestartKind, RestartStage, Role, Team } from './enums';
import { pointOnField } from './field';
import { render } from './render';
import { createDirector, type ReplayDirector } from './replay/director';
import { createRecorder, type ReplayRecorder } from './replay/recorder';
import { resetCoach } from './sim/coach';
import { controlPass, controlShoot } from './sim/control';
import { startFoul } from './sim/foul';
import { startHeader } from './sim/header';
import { resetPlayers } from './sim/players';
import { startReceive } from './sim/receive';
import { startPowerShot } from './sim/shot';
import { spawnReferee } from './sim/referee';
import { createWorld, enterIntro, resetBall, restartMatch, step } from './sim/world';
import type { RealGkHandle, RealGkHudPatch } from './types';

/** Broadcast banner copy per restart type/stage (enum → label; empty when the ball is live). */
const restartLabelFor = (kind: RestartKind, stage: RestartStage): string => {
  // During the sanction beat the call is still "foul" — the award (free kick / penalty) names itself at setup.
  if (stage === RestartStage.FoulFreeze || stage === RestartStage.RefArrive) return 'FOUL';
  switch (kind) {
    case RestartKind.Corner:
      return 'CORNER';
    case RestartKind.GoalKick:
      return 'GOAL KICK';
    case RestartKind.ThrowIn:
      return 'THROW-IN';
    case RestartKind.FreeKick:
      return 'FREE KICK';
    case RestartKind.Penalty:
      return 'PENALTY';
    default:
      return '';
  }
};

export interface RealGkEngineOptions {
  onHud: (patch: RealGkHudPatch) => void;
  /** Variant tunables (pitch size, sprite scale, camera). Defaults to the original v2 feel. */
  config?: RealGkConfig;
}

const clockStr = (time: number): string => {
  const seconds = Math.floor(time);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

const phaseFor = (time: number): string => (time < 45 ? 'First half' : time < 90 ? 'Second half' : 'Stoppage time');

/** Boots the Real Match Sim GK runtime onto a canvas. Returns imperative controls (incl. resize). */
export function createRealGkEngine(canvas: HTMLCanvasElement, opts: RealGkEngineOptions): RealGkHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;

  const config = opts.config ?? REAL_GK_V2_CONFIG;
  const assets = loadRealGkAssets(config.features !== undefined);
  const world = createWorld({ width: canvas.clientWidth || 800, height: canvas.clientHeight || 600 }, config);
  const dropTestBall = (): void => {
    if (!config.features?.ballEffects) return;
    const start = pointOnField(world.size, 0.58, 0.42);
    world.ball.ownerId = null;
    world.ball.lastKickerId = null;
    world.ball.x = start.x;
    world.ball.y = start.y;
    world.ball.z = 150;
    world.ball.vx = 82;
    world.ball.vy = 18;
    world.ball.vz = 10;
    world.ball.spinRate = 4;
    world.ball.cooldown = 3;
    world.ball.lofted = false;
  };
  const cam = createCamera(world);
  const recorder: ReplayRecorder | null = config.features?.replay ? createRecorder() : null;
  const director: ReplayDirector | null = recorder ? createDirector(world, recorder, cam) : null;

  // Playable sandbox: hold keys drive the controlled player; Space passes, X shoots.
  let removeInput: (() => void) | null = null;
  if (config.features?.playable) {
    world.control = { up: false, down: false, left: false, right: false };
    const setKey = (e: KeyboardEvent, down: boolean): void => {
      const c = world.control;
      if (!c) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') c.up = down;
      else if (k === 'arrowdown' || k === 's') c.down = down;
      else if (k === 'arrowleft' || k === 'a') c.left = down;
      else if (k === 'arrowright' || k === 'd') c.right = down;
      else return;
      e.preventDefault();
    };
    const controlled = (): (typeof world.players)[number] | undefined => world.players.find((p) => p.id === world.controlId);
    const onKeyDown = (e: KeyboardEvent): void => {
      const k = e.key.toLowerCase();
      if (k === ' ') {
        controlPass(world);
      } else if (k === 'x') {
        controlShoot(world);
      } else if (k === 'c' || k === 'v' || k === 'b') {
        const p = controlled();
        if (p && p.actionTimer <= 0) {
          if (k === 'c') startHeader(p);
          else startReceive(world, p, k === 'b'); // v = trap, b = intercept/steal
        }
      } else {
        setKey(e, true);
        return;
      }
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent): void => setKey(e, false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    removeInput = () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  let paused = false;
  let speed = 1;
  let flat = false;
  let raf = 0;
  let lastT = performance.now();
  // Edge-trigger for the foul beat: lock the camera on the referee when his run-in starts.
  let lastFoulStage: RestartStage | null = null;
  // Animation clock fed to render for looping sprite frames. It only advances while play runs, so a
  // pause / red-card freeze also freezes the walk/idle cycles (not just positions).
  let animClock = 0;

  const last = {
    scoreBlue: -1,
    scoreRed: -1,
    clock: '',
    phase: '',
    statusTitle: '',
    statusText: '',
    ballText: '',
    paused: !paused,
    speed: -1,
    refereeActive: !world.referee.active,
    goalActive: true,
    replayActive: true,
    redCardActive: true,
    goalTeam: 'x',
    introActive: true,
    introStage: 'x',
    restartActive: true,
    restartLabel: 'x',
    restartTeam: 'x',
    redCardName: 'x',
  };

  const syncHud = (): void => {
    const { match, referee } = world;
    const patch: RealGkHudPatch = {};
    if (match.blue !== last.scoreBlue) patch.scoreBlue = last.scoreBlue = match.blue;
    if (match.red !== last.scoreRed) patch.scoreRed = last.scoreRed = match.red;
    const cs = clockStr(match.time);
    if (cs !== last.clock) patch.clock = last.clock = cs;
    const ph = phaseFor(match.time);
    if (ph !== last.phase) patch.phase = last.phase = ph;
    if (match.statusTitle !== last.statusTitle) patch.statusTitle = last.statusTitle = match.statusTitle;
    if (match.statusText !== last.statusText) patch.statusText = last.statusText = match.statusText;
    if (match.ballText !== last.ballText) patch.ballText = last.ballText = match.ballText;
    if (paused !== last.paused) patch.paused = last.paused = paused;
    if (speed !== last.speed) patch.speed = last.speed = speed;
    if (referee.active !== last.refereeActive) patch.refereeActive = last.refereeActive = referee.active;
    const goalActive = match.celebration > 0;
    if (goalActive !== last.goalActive) patch.goalActive = last.goalActive = goalActive;
    const replayActive = director?.replayActive() ?? false;
    if (replayActive !== last.replayActive) patch.replayActive = last.replayActive = replayActive;
    const redCardActive = referee.active && referee.phase === RefPhase.Card;
    if (redCardActive !== last.redCardActive) patch.redCardActive = last.redCardActive = redCardActive;
    const goalTeam = match.celebration > 0 && match.scorer ? match.scorer : '';
    if (goalTeam !== last.goalTeam) patch.goalTeam = last.goalTeam = goalTeam;
    const introActive = match.phase === MatchPhase.Intro;
    if (introActive !== last.introActive) patch.introActive = last.introActive = introActive;
    const introStage = introActive ? match.introStage : '';
    if (introStage !== last.introStage) patch.introStage = last.introStage = introStage;
    const restartActive = match.restart !== null;
    if (restartActive !== last.restartActive) patch.restartActive = last.restartActive = restartActive;
    const restartLabel = match.restart ? restartLabelFor(match.restart.kind, match.restart.stage) : '';
    if (restartLabel !== last.restartLabel) patch.restartLabel = last.restartLabel = restartLabel;
    const restartTeam = match.restart ? match.restart.team : '';
    if (restartTeam !== last.restartTeam) patch.restartTeam = last.restartTeam = restartTeam;
    const redCardName = redCardActive && match.restart?.foul?.card
      ? world.players.find((p) => p.id === match.restart?.foul?.offenderId)?.name ?? ''
      : '';
    if (redCardName !== last.redCardName) patch.redCardName = last.redCardName = redCardName;
    if (Object.keys(patch).length) opts.onHud(patch);
  };

  const resize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || world.view.width;
    const h = canvas.clientHeight || world.view.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.imageSmoothingEnabled = false;
    world.view = { width: w, height: h };
    world.size = { width: w * config.fieldScale, height: h * config.fieldScale };
    world.dpr = dpr;
    if (world.players.length) {
      director?.reset();
      recorder?.clear();
      if (world.match.phase === MatchPhase.Intro) {
        // Re-lay the entrance for the new viewport (keeps players off-pitch mid-intro instead of snapping home).
        enterIntro(world);
      } else {
        resetPlayers(world);
        resetBall(world, world.match.kickoffTeam);
        resetCoach(world);
      }
    }
  };

  const frame = (now: number): void => {
    // A thrown frame must never kill the RAF loop (that reads as a hard freeze) — log once and keep going.
    try {
      const rawDt = Math.min(MAX_DT, (now - lastT) / 1000);
      lastT = now;
      const phase = world.match.phase;
      const simRunning = phase === MatchPhase.Intro || phase === MatchPhase.Live || phase === MatchPhase.Celebration;
      // Red card / any state that halts the sim also halts the sprite animation clock.
      const cardFrozen = world.referee.active && world.referee.phase === RefPhase.Card;
      if (!paused && simRunning && !cardFrozen) animClock += rawDt * 1000;
      if (!paused) {
        if (simRunning) step(world, rawDt * speed);
        if (director && recorder) {
          director.tick(rawDt, now);
          if (phase === MatchPhase.Live && world.match.celebration === 0) recorder.capture(world, now);
        }
      }
      // Foul sanction beat: hand the camera to the referee focus the moment his run-in begins.
      const foulStage = world.match.restart?.foul ? world.match.restart.stage : null;
      if (foulStage === RestartStage.RefArrive && lastFoulStage !== RestartStage.RefArrive) triggerRefereeFocus(cam);
      lastFoulStage = foulStage;
      const replayScene = director?.scene() ?? null;
      // Live camera follows play; the intro has its own choreography; the replay flow owns the camera (snap + track).
      if (!replayScene) {
        if (phase === MatchPhase.Intro) updateIntroCamera(cam, world);
        else if (phase === MatchPhase.Live || phase === MatchPhase.Celebration) updateCamera(cam, world, rawDt);
      }
      render(ctx, replayScene?.world ?? world, assets, cam, replayScene?.now ?? animClock, flat);
      if (director) {
        const overlayState = director.overlay();
        if (overlayState.dressing) drawReplayDressing(ctx, world.view, world.dpr, now);
        if (overlayState.wipeProgress !== null) {
          drawBroadcastWipe(ctx, world.view, world.dpr, overlayState.wipeProgress, [config.teams?.blue.flagId ?? '', config.teams?.red.flagId ?? '']);
        }
      }
      syncHud();
    } catch (err) {
      console.error('[realgk] frame error (recovered)', err);
    }
    raf = requestAnimationFrame(frame);
  };

  resize();
  dropTestBall();
  lastT = performance.now();
  raf = requestAnimationFrame(frame);
  syncHud();
  opts.onHud({
    cameraLabel: cameraLabel(cam),
    targetLabel: 'Follow: ball',
    teamBlueName: config.teams?.blue.name ?? 'Blue',
    teamRedName: config.teams?.red.name ?? 'Red',
    teamBlueFlag: config.teams?.blue.flagId ?? '',
    teamRedFlag: config.teams?.red.flagId ?? '',
  });

  return {
    togglePause: () => {
      paused = !paused;
      // Unpausing leaves a wall-clock hole in the ring (RAF keeps ticking); drop it so a fresh
      // goal takes the clean short-footage bail instead of lerping everything across the gap.
      if (!paused) recorder?.clear();
    },
    cycleSpeed: () => {
      speed = speed === 1 ? 2 : 1;
    },
    setFlat: (value: boolean) => {
      flat = value;
    },
    cycleCamera: () => opts.onHud({ cameraLabel: cyclePreset(cam) }),
    cycleTarget: () => opts.onHud({ targetLabel: cycleTarget(cam, world) }),
    restart: () => {
      director?.reset();
      recorder?.clear();
      restartMatch(world);
    },
    spawnReferee: () => {
      spawnReferee(world);
      triggerRefereeFocus(cam);
    },
    debugAction: (kind) => {
      if (!config.features) return;
      const squad = world.players.filter((p) => p.team === Team.Blue && p.role !== Role.GK);
      if (!squad.length) return;
      const p = squad.reduce((best, q) =>
        Math.hypot(q.x - world.ball.x, q.y - world.ball.y) < Math.hypot(best.x - world.ball.x, best.y - world.ball.y) ? q : best,
      );
      if (kind === 'header') startHeader(p);
      else if (kind === 'receive') startReceive(world, p, false);
      else if (kind === 'intercept') startReceive(world, p, true);
      else startPowerShot(p);
    },
    debugGoal: () => {
      // v4-only test hook — never active for v2/v3 (no features), so their 'g' stays a no-op.
      if (!config.features) return;
      if (world.match.phase !== MatchPhase.Live || world.match.celebration > 0) return;
      const { ball } = world;
      const squad = world.players.filter((p) => p.team === Team.Blue && p.role !== Role.GK);
      const shooter = squad.length
        ? squad.reduce((best, p) => (Math.hypot(p.x - ball.x, p.y - ball.y) < Math.hypot(best.x - ball.x, best.y - ball.y) ? p : best))
        : null;
      // Fire from close range into a top corner so the keeper rarely intercepts, regardless of viewport.
      const start = pointOnField(world.size, 0.9, 0.42);
      ball.ownerId = null;
      ball.lastKickerId = shooter?.id ?? null;
      ball.x = start.x;
      ball.y = start.y;
      ball.z = 4;
      ball.vx = 640;
      ball.vy = -40;
      ball.vz = 30;
      ball.spinRate = 0;
      ball.cooldown = 1.0;
    },
    debugBallDrop: dropTestBall,
    playIntro: () => {
      if (!config.features?.matchIntro) return;
      director?.reset();
      recorder?.clear();
      enterIntro(world);
    },
    debugFoul: (kind) => {
      // v5-only test hook: manufactures a challenge so the real sanction flow runs end-to-end.
      if (!config.features?.fouls) return;
      if (world.match.phase !== MatchPhase.Live || world.match.restart || world.match.celebration > 0) return;
      const victim = world.players
        .filter((p) => p.team === Team.Blue && p.role !== Role.GK)
        .sort((a, b) => Math.hypot(a.x - world.ball.x, a.y - world.ball.y) - Math.hypot(b.x - world.ball.x, b.y - world.ball.y))[0];
      if (!victim) return;
      const offender = world.players
        .filter((p) => p.team === Team.Red && p.role !== Role.GK)
        .sort((a, b) => Math.hypot(a.x - victim.x, a.y - victim.y) - Math.hypot(b.x - victim.x, b.y - victim.y))[0];
      if (!offender) return;
      if (kind === 'penalty') {
        // Stage the challenge inside Red's box so the detection awards the spot kick.
        const p = pointOnField(world.size, 0.88, 0.42);
        victim.x = p.x;
        victim.y = p.y;
        offender.x = p.x + 14;
        offender.y = p.y + 8;
        world.ball.x = p.x;
        world.ball.y = p.y;
        world.ball.z = 0;
        world.ball.ownerId = victim.id;
      }
      startFoul(world, offender, victim, kind === 'red');
    },
    debugRestart: (kind) => {
      // v5-only test hook: nudges the ball out of play so the real detection places the correct restart.
      if (!config.features?.deadBallSequence) return;
      if (world.match.phase !== MatchPhase.Live || world.match.restart || world.match.celebration > 0) return;
      const { ball, players, size } = world;
      const blue = players.find((p) => p.team === Team.Blue && p.role !== Role.GK);
      ball.ownerId = null;
      ball.z = 2;
      ball.vz = 12;
      ball.spinRate = 0;
      ball.cooldown = 0;
      if (kind === 'throwin') {
        const p = pointOnField(size, 0.5, 0.22);
        ball.x = p.x;
        ball.y = p.y;
        ball.vx = 0;
        ball.vy = -520; // over the top touchline → Red throw-in (Blue touched last)
        ball.lastKickerId = blue?.id ?? null;
      } else if (kind === 'corner') {
        const p = pointOnField(size, 0.9, 0.1);
        ball.x = p.x;
        ball.y = p.y;
        ball.vx = 520; // over Red's goal line, above the mouth → Blue corner
        ball.vy = -60;
        ball.lastKickerId = blue?.id ?? null;
      } else {
        const p = pointOnField(size, 0.1, 0.12);
        ball.x = p.x;
        ball.y = p.y;
        ball.vx = -520; // Blue puts it over its OWN goal line → Blue goal kick
        ball.vy = -40;
        ball.lastKickerId = blue?.id ?? null;
      }
    },
    resize,
    destroy: () => {
      cancelAnimationFrame(raf);
      removeInput?.();
    },
  };
}
