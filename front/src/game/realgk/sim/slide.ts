import { BodyAnim, PlayerAction, Role } from '../enums';
import { fieldBounds } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { BallText, Status } from './messages';
import { setStatus } from './rules';

/** Slide tackle (carrinho) shape — a low side lunge that glides forward and pokes the ball away. */
const SLIDE_DURATION = 0.66;
const SLIDE_COOLDOWN = 1.6;
/** The poke lands early (~30% in), where the leg is fully extended. */
const CONTACT_T = 0.3;
/** Forward glide speed the slide launches with (decays over the lunge). */
const SLIDE_LUNGE = 96;
/** Reach of the poke at contact (px). */
const REACH_X = 36;
const REACH_Y = 24;

/** Begins a slide tackle: lunge along the current facing, poke the ball at the contact frame. */
export function startSlideTackle(player: RealGkPlayer): boolean {
  if (player.role === Role.GK) return false;
  player.action = PlayerAction.SlideTackle;
  player.actionTimer = SLIDE_DURATION;
  player.actionElapsed = 0;
  player.mode = BodyAnim.SlideTackle;
  player.modeLock = SLIDE_DURATION;
  player.slideHit = false;
  player.vx = player.facing * SLIDE_LUNGE;
  player.vy = 0;
  return true;
}

/** Ticks an in-progress slide: glide forward, poke/strip the ball at contact if in reach, then recover. */
export function updateSlideTackle(world: RealGkWorld, player: RealGkPlayer, dt: number): boolean {
  if (player.action !== PlayerAction.SlideTackle) return false;
  player.actionTimer = Math.max(0, player.actionTimer - dt);
  player.actionElapsed += dt;
  const t = clamp(player.actionElapsed / SLIDE_DURATION, 0, 1);

  // Decelerating forward glide along the pitch.
  player.vx *= Math.pow(0.9, dt * 60);
  player.vy = 0;
  player.x += player.vx * dt;
  const bounds = fieldBounds(world.size, player.y);
  player.x = clamp(player.x, bounds.left + 12, bounds.right - 12);

  if (!player.slideHit && t >= CONTACT_T) {
    player.slideHit = true;
    const { ball } = world;
    const inReach = Math.abs(ball.x - player.x) < REACH_X && Math.abs(ball.y - player.y) < REACH_Y;
    if (inReach) {
      // Strip possession and knock the ball forward + up (a cleared poke).
      ball.ownerId = null;
      ball.lastKickerId = player.id;
      ball.cooldown = Math.max(ball.cooldown, 0.22);
      ball.vx = player.facing * 240;
      ball.vy = (((player.id * 7) % 11) - 5) * 12;
      ball.vz = 46;
      ball.lofted = true;
      world.match.ballText = BallText.wins(player.name);
      const note = Status.slideTackle(player.name);
      setStatus(world, note.title, note.text);
    }
  }

  if (player.actionTimer <= 0) {
    player.action = PlayerAction.None;
    player.mode = player.idleMode;
    player.modeLock = 0;
    player.slideCooldown = SLIDE_COOLDOWN;
    return false;
  }
  return true;
}
