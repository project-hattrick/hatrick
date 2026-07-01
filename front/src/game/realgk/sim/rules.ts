import { CELEBRATION } from '../constants';
import { Team } from '../enums';
import type { RealGkWorld } from '../types';
import { BallText, Status } from './messages';

export function setStatus(world: RealGkWorld, title: string, text: string): void {
  world.match.statusTitle = title;
  world.match.statusText = text;
}

/** Registers a goal, freezes play for the celebration, and flips the kickoff. */
export function goal(world: RealGkWorld, team: Team): void {
  const { match, ball } = world;
  if (team === Team.Blue) match.blue += 1;
  else match.red += 1;
  match.kickoffTeam = team === Team.Blue ? Team.Red : Team.Blue;
  match.celebration = CELEBRATION;
  ball.ownerId = null;
  ball.vx = 0;
  ball.vy = 0;
  ball.vz = 0;
  ball.z = 0;
  match.ballText = BallText.goal;
  const note = Status.goal(team);
  setStatus(world, note.title, note.text);
}
