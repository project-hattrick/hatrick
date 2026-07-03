import { snapCamera, updateReplayCamera, type RealGkCamera } from '../camera';
import { MatchPhase } from '../enums';
import { metrics } from '../field';
import { Status } from '../sim/messages';
import { setStatus } from '../sim/rules';
import { kickoffReset } from '../sim/world';
import type { RealGkWorld } from '../types';
import { createPlayback, materializeWorld, type ReplayPlayback, type ReplaySample } from './playback';
import type { ReplayRecorder } from './recorder';

const WIPE_SECONDS = 1.1; // slower, more dramatic TV transition
const LOOKBACK_SECONDS = 3.0;
const REPLAY_SPEED = 0.4;
const MIN_FOOTAGE_SECONDS = 0.5; // play whatever footage exists rather than bailing to a plain kickoff

export interface ReplayScene {
  world: RealGkWorld;
  now: number;
}

export interface ReplayOverlayState {
  /** Wipe progress in [0,1] while transitioning, null otherwise. */
  wipeProgress: number | null;
  /** Letterbox + REPLAY tag visible. */
  dressing: boolean;
}

export interface ReplayDirector {
  /** Advances the goal-flow phases. Call once per frame when not paused, after step(). */
  tick: (rawDt: number, now: number) => void;
  /** The materialized replay scene to render instead of the live world, or null for live. */
  scene: () => ReplayScene | null;
  overlay: () => ReplayOverlayState;
  replayActive: () => boolean;
  /** Drops any in-flight replay (resize/restart) and returns the match to live play. */
  reset: () => void;
}

const REPLAY_PHASES = new Set<MatchPhase>([MatchPhase.ReplayIn, MatchPhase.Replay, MatchPhase.ReplayOut]);

/** Owns the broadcast goal flow: celebration hand-off → wipe in → slow-mo playback → wipe out → kickoff. */
export function createDirector(world: RealGkWorld, recorder: ReplayRecorder, cam: RealGkCamera): ReplayDirector {
  let prevPhase = world.match.phase;
  let playback: ReplayPlayback | null = null;
  let progress = 0;
  let goalT = 0;
  let didKickoffReset = false;

  const currentSample = (): ReplaySample | null => {
    if (!playback) return null;
    return playback.sample(Math.min(progress, playback.durationSeconds));
  };

  const finishToLive = (): void => {
    playback = null;
    progress = 0;
    recorder.clear();
  };

  // Kickoff reset while staying in ReplayOut so the outgoing wipe still finishes over the new scene.
  const performKickoffReset = (): void => {
    didKickoffReset = true;
    const timer = world.match.phaseTimer;
    kickoffReset(world);
    world.match.phase = MatchPhase.ReplayOut;
    world.match.phaseTimer = timer;
    const m = metrics(world.size);
    snapCamera(cam, world, world.size.width / 2, (m.topY + m.bottomY) / 2, cam.presets[cam.presetIdx].zoom);
  };

  const enterReplay = (): boolean => {
    playback = createPlayback(recorder.slice(goalT - LOOKBACK_SECONDS * 1000, goalT + 1));
    if (!playback || playback.durationSeconds < MIN_FOOTAGE_SECONDS) {
      playback = null;
      return false;
    }
    progress = 0;
    const first = playback.sample(0);
    snapCamera(cam, world, first.ball.x, first.ball.y, Math.max(cam.z, cam.presets[0].zoom * 1.4));
    const note = Status.replay();
    setStatus(world, note.title, note.text);
    return true;
  };

  const tick = (rawDt: number, now: number): void => {
    const { match } = world;

    // The goal frame itself: force one capture the instant the celebration starts.
    if (match.phase === MatchPhase.Celebration && prevPhase === MatchPhase.Live) {
      recorder.capture(world, now, true);
      goalT = now;
    }

    if (match.phase === MatchPhase.ReplayIn) {
      if (prevPhase !== MatchPhase.ReplayIn) match.phaseTimer = 0;
      match.phaseTimer += rawDt;
      // Build the playback at the covered midpoint; bail to a covered kickoff when footage is too short.
      if (match.phaseTimer >= WIPE_SECONDS / 2 && !playback && !didKickoffReset) {
        if (!enterReplay()) {
          // No footage: reset under cover and let the wipe finish over the kickoff scene (no replay).
          performKickoffReset();
          match.phase = MatchPhase.ReplayOut;
          match.phaseTimer = WIPE_SECONDS / 2;
          prevPhase = world.match.phase;
          return;
        }
      }
      if (match.phaseTimer >= WIPE_SECONDS) {
        match.phase = MatchPhase.Replay;
        match.phaseTimer = 0;
      }
    } else if (match.phase === MatchPhase.Replay) {
      progress += rawDt * REPLAY_SPEED;
      const sample = currentSample();
      if (sample) updateReplayCamera(cam, world, sample.ball.x, sample.ball.y);
      if (!playback || progress >= playback.durationSeconds) {
        match.phase = MatchPhase.ReplayOut;
        match.phaseTimer = 0;
        didKickoffReset = false;
      }
    } else if (match.phase === MatchPhase.ReplayOut) {
      match.phaseTimer += rawDt;
      if (match.phaseTimer >= WIPE_SECONDS / 2 && !didKickoffReset) {
        performKickoffReset();
      }
      if (match.phaseTimer >= WIPE_SECONDS) {
        match.phase = MatchPhase.Live;
        match.phaseTimer = 0;
        // Must clear here: otherwise the NEXT goal's ReplayIn sees didKickoffReset=true and skips the
        // replay entirely (only the first goal would ever replay).
        didKickoffReset = false;
        finishToLive();
      }
    }

    prevPhase = world.match.phase;
  };

  const showingReplayFrame = (): boolean => {
    const { match } = world;
    if (!playback) return false;
    return (
      match.phase === MatchPhase.Replay ||
      (match.phase === MatchPhase.ReplayIn && match.phaseTimer >= WIPE_SECONDS / 2) ||
      (match.phase === MatchPhase.ReplayOut && !didKickoffReset)
    );
  };

  const scene = (): ReplayScene | null => {
    if (!showingReplayFrame()) return null;
    const sample = currentSample();
    if (!sample) return null;
    return { world: materializeWorld(world, sample), now: sample.replayNow };
  };

  const overlay = (): ReplayOverlayState => {
    const { match } = world;
    const wiping = match.phase === MatchPhase.ReplayIn || match.phase === MatchPhase.ReplayOut;
    return {
      wipeProgress: wiping ? Math.min(1, match.phaseTimer / WIPE_SECONDS) : null,
      dressing: showingReplayFrame(),
    };
  };

  return {
    tick,
    scene,
    overlay,
    replayActive: () => REPLAY_PHASES.has(world.match.phase),
    reset: () => {
      if (REPLAY_PHASES.has(world.match.phase)) {
        kickoffReset(world);
        world.match.phase = MatchPhase.Live;
        world.match.phaseTimer = 0;
      }
      didKickoffReset = false;
      finishToLive();
      prevPhase = world.match.phase;
    },
  };
}
