import { animDuration } from '../assets/animation';
import { GOALKEEPER_SPECS, OUTFIELD_SPECS } from '../assets/manifest';
import { CELEBRATE_TICKS, GOAL_PAUSE, KICKOFF_DELAY } from '../core/constants';
import type { Player, World } from '../core/types';
import { GoalkeeperAnim, OutfieldAnim, Role, Team } from '../enums';
import { MatchEvent, goalMessage } from './events';
import { dirOf } from './teams';

const KICK_DUR = animDuration(OUTFIELD_SPECS[OutfieldAnim.Kick]);
const GK_GOALKICK_DUR = animDuration(GOALKEEPER_SPECS[GoalkeeperAnim.GoalKick]);

/** Stamps the ticker; the seq lets the HUD re-show a repeated message. */
export function setEvent(world: World, text: string): void {
  world.event = text;
  world.eventSeq++;
}

/** Strikes the ball from a kicker toward (dx, dy) with optional lob. */
export function kick(world: World, dx: number, dy: number, power: number, lob: boolean, kicker: Player | null): void {
  const { ball } = world;
  const m = Math.hypot(dx, dy) || 1;
  ball.vx = (dx / m) * power;
  ball.vy = (dy / m) * power;
  if (lob) ball.vz = 6;
  world.freeBall = 16;
  if (kicker) {
    kicker.kickUntil = world.tick + KICK_DUR;
    kicker.kickStart = world.tick;
    kicker.faceX = dx / m;
    kicker.faceY = dy / m;
  }
}

/** Keeper hoofs the ball back into play. */
export function gkClear(world: World, p: Player): void {
  const { ball } = world;
  const dx = dirOf(p.team);
  ball.vx = dx * 6.2;
  ball.vy = (Math.random() * 2 - 1) * 1.5;
  ball.vz = 6;
  world.freeBall = 18;
  p.gkKickUntil = world.tick + GK_GOALKICK_DUR;
  p.gkKickStart = world.tick;
  setEvent(world, MatchEvent.GoalKick);
}

/** Registers a goal, freezes play, triggers celebration, and schedules the kickoff. */
export function goal(world: World, team: Team): void {
  if (team === Team.Blue) world.scoreBlue++;
  else world.scoreRed++;
  setEvent(world, goalMessage(team));
  world.pausaGol = GOAL_PAUSE;
  world.ball.vx = 0;
  world.ball.vy = 0;
  for (const p of world.players) if (p.team === team && p.role !== Role.GK) p.celUntil = world.tick + CELEBRATE_TICKS;
  world.kickoffTick = world.tick + KICKOFF_DELAY;
}
