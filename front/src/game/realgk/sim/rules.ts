import { CELEBRATION } from '../constants';
import { MatchPhase, Team } from '../enums';
import type { RealGkWorld } from '../types';
import { CELEBRATION_LIVE_SECONDS, startCelebrations } from './celebration';
import { BallText, Status } from './messages';

export function setStatus(world: RealGkWorld, title: string, text: string): void {
  world.match.statusTitle = title;
  world.match.statusText = text;
}

/**
 * Registers a goal, freezes play for the celebration, and flips the kickoff.
 * `count` (default true) increments the scoreline; pass `false` in feed-driven mode where the score is
 * authoritative from the feed (`setScore`) — this runs the full celebration/replay flow without counting,
 * so the same goal event carrying `score` doesn't double-count.
 */
export function goal(world: RealGkWorld, team: Team, count = true): void {
  const { match, ball } = world;
  const features = world.cfg.features;
  if (count) {
    if (team === Team.Blue) match.blue += 1;
    else match.red += 1;
  }
  match.scorer = team;
  match.kickoffTeam = team === Team.Blue ? Team.Red : Team.Blue;
  if (features?.celebrations || features?.replay) {
    // v4 broadcast flow: short live celebration, then the replay director takes over.
    match.celebration = CELEBRATION_LIVE_SECONDS;
    match.phase = MatchPhase.Celebration;
    if (features.celebrations) startCelebrations(world, team);
  } else {
    match.celebration = CELEBRATION;
  }
  ball.ownerId = null;
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  ball.z = 0;
  match.ballText = BallText.goal;
  const note = Status.goal(team);
  setStatus(world, note.title, note.text);
}
