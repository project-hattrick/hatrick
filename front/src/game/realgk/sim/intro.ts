import { OPENING_FULL_PITCH_SECONDS } from '../constants';
import { IntroStage, MatchPhase, RefPhase, Role } from '../enums';
import { centerSpot, pointOnField } from '../field';
import type { RealGkWorld } from '../types';
import { updateCoach } from './coach';
import { flushDirectives } from './directives';
import { Status } from './messages';
import { applyLivelyIdle, livelyIdlePlayer, moveToward } from './players';
import { spawnRefereeKickoff, updateReferee } from './referee';
import { setStatus } from './rules';

/** Beat lengths for the v5 pre-match entrance (seconds). */
const SHOWCASE_SECONDS = 2.2;
const SPONSOR_SWEEP_SECONDS = 3.4;
/** Hard cap so a stuck walk-on never blocks kickoff. */
const RISE_TIMEOUT_SECONDS = 7;
const KICKOFF_HOLD_SECONDS = 0.5;
/** Distance (px) at which a player is considered "home". */
const ARRIVE_EPS = 7;

function advance(world: RealGkWorld, stage: IntroStage): void {
  world.match.introStage = stage;
  world.match.introTimer = 0;
}

/**
 * Advances the v5 pre-match entrance: Showcase (teams + flags) → SponsorSweep (wide pan over the boards) →
 * RiseIn (players walk on from below) → RefWhistle (referee jogs to center + whistles) → Kickoff → Live.
 * Owns the tick while `phase === Intro`; the camera side is handled by `updateIntroCamera`.
 */
export function updateIntro(world: RealGkWorld, dt: number): void {
  const { match } = world;
  match.introTimer += dt;

  // Referee + coach keep animating throughout the intro (players are driven per-stage below).
  updateReferee(world, dt);
  updateCoach(world, dt);

  switch (match.introStage) {
    case IntroStage.Showcase:
      if (match.introTimer >= SHOWCASE_SECONDS) advance(world, IntroStage.SponsorSweep);
      return;

    case IntroStage.SponsorSweep:
      if (match.introTimer >= SPONSOR_SWEEP_SECONDS) advance(world, IntroStage.RiseIn);
      return;

    case IntroStage.RiseIn: {
      let allHome = true;
      for (const p of world.players) {
        const home = pointOnField(world.size, p.homeLat, p.homeDepth);
        const dist = Math.hypot(home.x - p.x, home.y - p.y);
        if (dist <= ARRIVE_EPS) {
          // Arrived: lifelike idle (varied facing + gentle sway) for `livelyMatch` variants (room/persona);
          // legacy checkpoints keep the frozen home pose byte-for-byte.
          if (world.cfg.features?.livelyMatch) {
            livelyIdlePlayer(world, p, match.introTimer);
          } else {
            p.x = home.x;
            p.y = home.y;
            p.vx = 0;
            p.vy = 0;
            p.mode = p.idleMode;
          }
          continue;
        }
        allHome = false;
        // Staggered start (back-to-front) via introDelay; walk on without the pitch clamp (they start off-pitch).
        if (match.introTimer >= p.introDelay) {
          moveToward(world, p, home.x, home.y, p.role === Role.GK ? 70 : 96, dt, false);
        }
      }
      const riseTimeout = world.cfg.features?.quickIntro ? 4 : RISE_TIMEOUT_SECONDS;
      if (allHome || match.introTimer >= riseTimeout) {
        // Feed-driven buffering: hold the cinematic loop until the first real event releases the kickoff.
        if (match.introHold) {
          advance(world, IntroStage.HoldLoop);
          return;
        }
        // Quick intro: no referee run-in — straight to the kickoff once the squads are arranged.
        if (world.cfg.features?.quickIntro) {
          advance(world, IntroStage.Kickoff);
          return;
        }
        spawnRefereeKickoff(world);
        advance(world, IntroStage.RefWhistle);
      }
      return;
    }

    case IntroStage.HoldLoop:
      // Squads idle at their homes; `livelyMatch` variants get varied facings + sway, legacy stays frozen.
      // The camera loops its beats off introTimer.
      if (world.cfg.features?.livelyMatch) {
        applyLivelyIdle(world);
      } else {
        for (const p of world.players) {
          p.vx *= 0.8;
          p.vy *= 0.8;
          p.mode = p.idleMode;
        }
      }
      if (!match.introHold) {
        spawnRefereeKickoff(world);
        advance(world, IntroStage.RefWhistle);
      }
      return;

    case IntroStage.RefWhistle:
      // Hold players at home; the referee run-to-center + whistle is driven by updateReferee above.
      if (world.cfg.features?.livelyMatch) {
        applyLivelyIdle(world);
      } else {
        for (const p of world.players) {
          p.vx *= 0.8;
          p.vy *= 0.8;
          p.mode = p.idleMode;
        }
      }
      if (world.referee.phase === RefPhase.Whistle) advance(world, IntroStage.Kickoff);
      return;

    case IntroStage.Kickoff:
      if (match.introTimer >= KICKOFF_HOLD_SECONDS) {
        // Leave the ball loose at center (no teleport of a player onto it) — the nearest player runs on.
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
        match.phase = MatchPhase.Live;
        // Full-pitch reveal as the intro hands off to live play (the autonomous /engine match start).
        if (world.cfg.features?.openingFullPitch) world.openingT = OPENING_FULL_PITCH_SECONDS;
        const note = Status.kickoff();
        setStatus(world, note.title, note.text);
        // Anything the feed sent during the intro lands on the pitch now.
        flushDirectives(world);
      }
      return;
  }
}
