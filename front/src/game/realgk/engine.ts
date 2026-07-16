import { MAX_DT } from './constants';
import { REAL_GK_MATCH_CONFIG, type RealGkConfig } from './config';
import { debugEvent as runDebugEvent } from './engine-debug';
import { loadRealGkAssets } from './assets/loader';
import { drawBroadcastWipe, drawReplayDressing } from './broadcast';
import { cameraLabel, calibrationRect, createCamera, pinCalibrationCamera, requestShake, triggerRefereeFocus, updateCamera, updateIntroCamera } from './camera';
import { BodyAnim, DrivenDirective, IntroStage, MatchPhase, RefPhase, RestartKind, RestartStage, Role, Team } from './enums';
import { centerSpot, fieldRatios, pointOnField, setFieldSpec } from './field';
import { shotEffectLabelFor, shotSlowMoScale } from './effects';
import { render } from './render';
import { detectQualityTier, quality, setQualityTier } from './quality';
import { createDirector, type ReplayDirector } from './replay/director';
import { createRecorder, type ReplayRecorder } from './replay/recorder';
import { resetCoach } from './sim/coach';
import { controlPass, controlShoot } from './sim/control';
import { startHeader } from './sim/header';
import { resetPlayers } from './sim/players';
import { startReceive } from './sim/receive';
import { controlKeeperDive } from './sim/keeper';
import { startSlideTackle } from './sim/slide';
import { freshDrivenClock, setClockDriven } from './sim/driven-clock';
import { createWorld, enterDrivenKickoff, enterIntro, resetBall, restartMatch, resumeFromBreak, setPhaseDriven, step } from './sim/world';
import { directDriven } from './sim/directives';
import { setScoreDriven } from './sim/driver';
import { armFiller } from './sim/filler';
import { resetReferee } from './sim/referee';
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

  const config = opts.config ?? REAL_GK_MATCH_CONFIG;
  // Detect the device tier once — caps the retina buffer, particle count and ambient shadows on weak devices.
  setQualityTier(detectQualityTier());
  // Map the pitch onto this config's court art BEFORE the world spawns off metrics().
  setFieldSpec(config.field);
  const assets = loadRealGkAssets(
    config.features !== undefined,
    config.features?.personaHeads === true,
    config.personaBodyRoot,
    config.courtImage,
    config.assetVersion,
    config.personaBodyRootAway,
    config.assetVersionAway,
  );
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

  // GK control: follow YOUR keeper by default — following the ball keeps the controlled player
  // off-screen most of the match, which reads as "the game plays itself".
  if (config.keeperControl) {
    const gkIdx = world.players.findIndex((p) => p.role === Role.GK && p.team === Team.Blue);
    if (gkIdx >= 0) {
      cam.targetIdx = gkIdx;
      opts.onHud({ targetLabel: `Follow: ${world.players[gkIdx].name}` });
    }
  }

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
      } else if (k === 'f') {
        const p = controlled();
        if (p && p.actionTimer <= 0 && p.slideCooldown <= 0) startSlideTackle(world, p); // f = slide tackle (carrinho)
      } else if (k === 'q' || k === 'e') {
        controlKeeperDive(world, k === 'q' ? -1 : 1); // q/e = keeper dive toward the top / bottom post
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
  // Calibration view (opt-in via handle.setCalibrationView): pins the camera to a fixed full-court frame
  // so the /engine court editor can drag handles against a static court while the match plays live.
  let calibration = false;
  let raf = 0;
  // Activity gate: false stops the RAF loop entirely (tab hidden / hero scrolled off-screen). Distinct
  // from `paused`, which only halts the sim — the loop kept rendering. Here nothing runs while inactive.
  let running = true;
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
    halfTimeActive: true,
    fullTimeActive: true,
    winnerTeam: 'x',
    cardFlashSeq: -1,
  };

  const syncHud = (): void => {
    const { match, referee } = world;
    const patch: RealGkHudPatch = {};
    if (match.blue !== last.scoreBlue) patch.scoreBlue = last.scoreBlue = match.blue;
    if (match.red !== last.scoreRed) patch.scoreRed = last.scoreRed = match.red;
    const cs = clockStr(match.time);
    if (cs !== last.clock) patch.clock = last.clock = cs;
    const halfTimeActive = match.phase === MatchPhase.HalfTime;
    const fullTimeActive = match.phase === MatchPhase.FullTime;
    if (halfTimeActive !== last.halfTimeActive) patch.halfTimeActive = last.halfTimeActive = halfTimeActive;
    if (fullTimeActive !== last.fullTimeActive) patch.fullTimeActive = last.fullTimeActive = fullTimeActive;
    const winnerTeam = fullTimeActive ? (match.blue > match.red ? Team.Blue : match.red > match.blue ? Team.Red : '') : '';
    if (winnerTeam !== last.winnerTeam) patch.winnerTeam = last.winnerTeam = winnerTeam;
    // Driven clock is real match seconds; the attract clock has always fed phaseFor raw (legacy quirk).
    const ph = fullTimeActive ? 'Full time' : halfTimeActive ? 'Half-time' : phaseFor(world.driven ? match.time / 60 : match.time);
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
    // Feed-driven card broadcast: push the whole flash (colour + team) whenever the counter advances.
    if (match.cardFlashSeq !== last.cardFlashSeq) {
      last.cardFlashSeq = match.cardFlashSeq;
      patch.cardFlashSeq = match.cardFlashSeq;
      patch.cardFlashColor = match.cardFlashColor;
      patch.cardFlashTeam = match.cardFlashTeam;
    }
    if (Object.keys(patch).length) opts.onHud(patch);
  };

  const resize = (): void => {
    // Cap the backing-store scale so a 2–3x display doesn't render a giant buffer every frame.
    const dpr = Math.min(window.devicePixelRatio || 1, quality().dprCap);
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
      const simRunning =
        phase === MatchPhase.Intro ||
        phase === MatchPhase.Live ||
        phase === MatchPhase.Celebration ||
        phase === MatchPhase.HalfTime ||
        phase === MatchPhase.FullTime;
      const timeScale = shotSlowMoScale(world);
      // feel.saveImpact hitstop: freeze the sim (and sprite clock) for a few frames on a diving catch.
      const hitstopActive = world.feelFx.hitstop > 0;
      if (hitstopActive) world.feelFx.hitstop = Math.max(0, world.feelFx.hitstop - rawDt);
      // Red card / any state that halts the sim also halts the sprite animation clock.
      const cardFrozen = world.referee.active && world.referee.phase === RefPhase.Card;
      if (!paused && simRunning && !cardFrozen && !hitstopActive) animClock += rawDt * 1000;
      if (!paused) {
        if (simRunning && !hitstopActive) step(world, rawDt * speed * timeScale);
        if (director && recorder) {
          director.tick(rawDt, now);
          if (phase === MatchPhase.Live && world.match.celebration === 0) recorder.capture(world, now);
        }
      }
      // Hand any queued camera-shake request (feel.saveImpact / punt) to the camera before it updates.
      if (world.feelFx.shake > 0) {
        requestShake(cam, world.feelFx.shake);
        world.feelFx.shake = 0;
      }
      // Foul sanction beat: hand the camera to the referee focus the moment his run-in begins.
      const foulStage = world.match.restart?.foul ? world.match.restart.stage : null;
      if (foulStage === RestartStage.RefArrive && lastFoulStage !== RestartStage.RefArrive) triggerRefereeFocus(cam);
      lastFoulStage = foulStage;
      const replayScene = director?.scene() ?? null;
      // Calibration view pins a fixed full-court frame (court editor); otherwise the live camera follows
      // play, the intro has its own choreography, and the replay flow owns the camera (snap + track).
      if (calibration) {
        pinCalibrationCamera(cam, world);
      } else if (!replayScene) {
        if (phase === MatchPhase.Intro) updateIntroCamera(cam, world);
        else if (phase !== MatchPhase.ReplayIn && phase !== MatchPhase.Replay && phase !== MatchPhase.ReplayOut)
          updateCamera(cam, world, rawDt); // Live / Celebration / HalfTime / FullTime all use the follow camera
      }
      render(ctx, replayScene?.world ?? world, assets, cam, replayScene?.now ?? animClock, flat);
      if (director) {
        const overlayState = director.overlay();
        if (overlayState.dressing) drawReplayDressing(ctx, world.view, world.dpr, now);
        if (overlayState.wipeProgress !== null) {
          drawBroadcastWipe(
            ctx,
            world.view,
            world.dpr,
            overlayState.wipeProgress,
            [config.teams?.blue.flagId ?? '', config.teams?.red.flagId ?? ''],
            [config.teams?.blue.colors, config.teams?.red.colors],
          );
        }
      }
      syncHud();
    } catch (err) {
      console.error('[realgk] frame error (recovered)', err);
    }
    // Only reschedule while active — the activity gate stops the loop dead when nothing's visible.
    if (running) raf = requestAnimationFrame(frame);
  };

  // Feed directive gate: nothing restarts play after the final whistle, and any on-pitch directive
  // during the break implies the second half is underway (feeds don't always re-send kickoff).
  const direct = (kind: DrivenDirective, team: Team, threat = 0, red = false, outcome?: string): void => {
    if (world.match.phase === MatchPhase.FullTime) return;
    if (world.match.phase === MatchPhase.HalfTime) resumeFromBreak(world);
    directDriven(world, kind, team, threat, red, outcome);
  };

  resize();
  dropTestBall();
  lastT = performance.now();
  raf = requestAnimationFrame(frame);
  syncHud();
  opts.onHud({
    cameraLabel: cameraLabel(cam),
    targetLabel: 'Follow: ball',
    shotEffectLabel: shotEffectLabelFor(world.ballEffects.shotStyle),
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
    // Live per-court field remap: setFieldSpec already resets to field.ts DEFAULT_* before applying, so a
    // full spec each drag overwrites the previous court's mapping (no stale merge). metrics() reads the
    // mutated refs every frame, so players/ball/goals re-map live.
    setField: (spec) => setFieldSpec(spec),
    setCalibrationView: (on) => {
      calibration = on;
    },
    calibrationFit: () => (calibration ? calibrationRect(world) : null),
    restart: () => {
      director?.reset();
      recorder?.clear();
      restartMatch(world);
    },
    setKeeperDivePack: (variant) => {
      // Sandbox knob: which dive pack Q/E (and the AI keepers) play. 'auto' = config feature flags.
      world.divePackOverride =
        variant === 'v2' ? BodyAnim.GkDiveV2 : variant === 'save' ? BodyAnim.GkDive : variant === 'compact' ? BodyAnim.GkDiveCompact : undefined;
    },
    setFeel: (patch) => {
      // Feel lab: flip smoothing experiments live (no reboot). Merged over the current flags.
      Object.assign(world.feel, patch);
    },
    // ---- feed director (drives the sim from an external match event stream; mirrors HeadsOnlyHandle) ----
    beginDrivenIntro: () => {
      // Match switch: run the cinematic entrance and HOLD it (camera loop) until the first real event.
      director?.reset();
      recorder?.clear();
      world.driven = true;
      world.intent = { attackingTeam: null, threat: 0 };
      world.match.blue = 0;
      world.match.red = 0;
      world.match.time = 0;
      world.drivenClock = freshDrivenClock();
      world.possessionGrant = null;
      world.pendingDirectives = [];
      armFiller(world);
      resetPlayers(world);
      const c = centerSpot(world.size);
      world.ball.x = c.x;
      world.ball.y = c.y;
      world.ball.z = 0;
      world.ball.vx = 0;
      world.ball.vy = 0;
      world.ball.vz = 0;
      world.ball.ownerId = null;
      world.ball.lastKickerId = null;
      world.ball.cooldown = 0;
      resetReferee(world);
      resetCoach(world);
      world.match.phase = MatchPhase.Intro;
      world.match.introStage = IntroStage.HoldLoop;
      world.match.introTimer = 0;
      world.match.introHold = true;
    },
    setDriven: (on) => {
      world.driven = on;
      if (on) {
        if (world.match.phase === MatchPhase.Intro && world.match.introHold) {
          // First event during the buffering hold: release the intro (whistle → kickoff → Live).
          // No enterDrivenKickoff — players are already at their homes and the ball is parked center.
          world.match.introHold = false;
          return;
        }
        // Drop any in-flight goal replay so the mode switch starts on a clean live kickoff.
        director?.reset();
        recorder?.clear();
        enterDrivenKickoff(world);
      } else {
        world.drivenClock = null; // attract mode resumes the TIME_SCALE clock
        world.pendingDirectives = [];
        world.match.introHold = false; // a held intro completes into the attract match
      }
    },
    setPossession: (team, threat) => direct(DrivenDirective.Possession, team, threat),
    injectShot: (team, outcome) => direct(DrivenDirective.Shot, team, 0, false, outcome),
    injectGoal: (team) => direct(DrivenDirective.Goal, team),
    injectCorner: (team) => direct(DrivenDirective.Corner, team),
    injectCard: (team, red = false) => direct(DrivenDirective.Card, team, 0, red),
    injectPenalty: (team) => direct(DrivenDirective.Penalty, team),
    injectFreeKick: (team, danger = 0) => direct(DrivenDirective.FreeKick, team, danger),
    setScore: (blue, red) => setScoreDriven(world, blue, red),
    setClock: (minute) => setClockDriven(world, minute, performance.now()),
    setPhase: (phase) => setPhaseDriven(world, phase),
    debugEvent: (kind, team) => runDebugEvent(world, kind, team),
    setRosterNames: (blue, red) => {
      // Persist for any future re-spawn, then rename the current squad in place (name only drives the
      // HUD/commentary — safe to mutate live). Assigns per-team in array order; missing rows keep their label.
      world.cfg.rosterNames = { blue, red };
      const assign = (team: Team, names: string[]): void => {
        if (!names?.length) return;
        let i = 0;
        for (const p of world.players) {
          if (p.team !== team) continue;
          const real = names[i]?.trim();
          if (real) p.name = real;
          i += 1;
        }
      };
      assign(Team.Blue, blue);
      assign(Team.Red, red);
    },
    sampleRadar: () => {
      const ballRatio = fieldRatios(world.size, world.ball.x, world.ball.y);
      return {
        actors: world.players.map((p) => {
          const r = fieldRatios(world.size, p.x, p.y);
          return { lat: r.lat, depth: r.depth, home: p.team === Team.Blue };
        }),
        ball: { lat: ballRatio.lat, depth: ballRatio.depth },
      };
    },
    setActive: (active: boolean) => {
      if (active === running) return;
      running = active;
      if (active) {
        // Reset the clock so MAX_DT swallows the hidden/off-screen gap, and drop the stale replay ring.
        lastT = performance.now();
        recorder?.clear();
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    resize,
    destroy: () => {
      running = false;
      cancelAnimationFrame(raf);
      removeInput?.();
    },
  };
}
