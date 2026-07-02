import { CELEBRATION } from '../constants';
import { MatchPhase, Team } from '../enums';
import type { RealGkWorld } from '../types';
import { CELEBRATION_LIVE_SECONDS, startCelebrations } from './celebration';
import { BallText, Status } from './messages';

export function setStatus(world: RealGkWorld, title: string, text: string): void {
  world.match.statusTitle = title;
  world.match.statusText = text;
}

/** Registers a goal, freezes play for the celebration, and flips the kickoff. */
export function goal(world: RealGkWorld, team: Team): void {
  const { match, ball } = world;
  const features = world.cfg.features;
  if (team === Team.Blue) match.blue += 1;
  else match.red += 1;
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
