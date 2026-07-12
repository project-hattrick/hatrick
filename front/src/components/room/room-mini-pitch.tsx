'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { formationDots, formationFor, type FormationDot } from '@/config/team-lineups.config';
import { teamColor } from '@/config/team-colors.config';
import { MatchAction } from '@/enums/match-action.enum';
import { fifaToIso } from '@/lib/country';
import { useDisplayEvents, useDisplayMatch } from '@/store/match.store';
import { useRoomRadarStore } from '@/store/room-radar.store';
import type { MatchEventPayload } from '@/types/match';
import { cn } from '@/lib/utils';

/** A single positioned radar dot (percentages within the pitch box) + its side color. */
interface RadarDot {
  key: string;
  x: number;
  y: number;
  color: string;
  live: boolean;
}

/** Deterministic per-dot jitter so the formation fallback feels alive before the engine boots. */
function jitter(seed: number, minute: number, axis: number): number {
  const n = Math.imul(seed * 31 + minute * 7 + axis * 13, 2654435761) >>> 0;
  return ((n % 500) / 100 - 2.5) * 0.9; // ±2.25% drift
}

/** Formation dots for one side, jittered — used only until the live engine snapshot arrives. */
function formationRadarDots(dots: FormationDot[], color: string, minute: number, seedBase: number): RadarDot[] {
  return dots.map((dot) => ({
    key: `${seedBase}-${dot.number}`,
    x: dot.x + jitter(seedBase + dot.number, minute, 1),
    y: dot.y + jitter(seedBase + dot.number, minute, 2),
    color,
    live: false,
  }));
}

function MiniDots({ dots }: { dots: RadarDot[] }) {
  return (
    <>
      {dots.map((dot) => (
        <span
          key={dot.key}
          className={cn(
            'absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-black/40 transition-all ease-linear',
            dot.live ? 'duration-100' : 'duration-1000 ease-in-out',
          )}
          style={{ left: `${dot.x}%`, top: `${dot.y}%`, backgroundColor: dot.color }}
        />
      ))}
    </>
  );
}

function ballXFor(event: MatchEventPayload | undefined): number {
  if (!event?.participant) return 50;
  const attacking = event.possessionType === 'HighDanger' || event.action === MatchAction.Goal || event.action === MatchAction.Penalty;
  const dangerous = event.possessionType === 'Danger' || event.action === MatchAction.Corner;
  const attackingThird = attacking ? 82 : dangerous ? 74 : event.possessionType === 'Attack' ? 66 : 58;
  return event.participant === 1 ? attackingThird : 100 - attackingThird;
}

function ballYFor(event: MatchEventPayload | undefined, minute: number): number {
  if (event?.action === MatchAction.Corner) return minute % 2 === 0 ? 18 : 82;
  if (event?.action === MatchAction.Penalty || event?.action === MatchAction.Goal) return 50;
  return 50 + jitter(11, minute, 4) * 4;
}

function isHot(event: MatchEventPayload | undefined): boolean {
  return (
    event?.possessionType === 'HighDanger' ||
    event?.action === MatchAction.Goal ||
    event?.action === MatchAction.Penalty ||
    event?.action === MatchAction.Corner
  );
}

/**
 * The mini watcher — a compact 2D radar of the pitch with both teams' dots and the ball. When the room's
 * ambient match engine is live it mirrors the ACTUAL on-pitch positions (sampled into the radar store);
 * before the engine boots it falls back to a formation stand-in, drifting subtly with the clock. The
 * possession glow + attacking-side flash stay feed-driven so dangerous moments still light up.
 */
export function RoomMiniPitch({ className }: { className?: string }) {
  const match = useDisplayMatch();
  const events = useDisplayEvents();
  const radar = useRoomRadarStore((state) => state.radar);

  const homeColor = teamColor(fifaToIso(match.home.code));
  const awayColor = teamColor(fifaToIso(match.away.code));

  // Live positions when the engine is running; formation stand-in only until the first snapshot lands.
  const dots: RadarDot[] = radar
    ? radar.actors.map((a, i) => ({ key: `live-${i}`, x: a.lat * 100, y: a.depth * 100, color: a.home ? homeColor : awayColor, live: true }))
    : [
        ...formationRadarDots(formationDots(formationFor(match.home.code), 'home'), homeColor, match.minute, 100),
        ...formationRadarDots(formationDots(formationFor(match.away.code), 'away'), awayColor, match.minute, 200),
      ];

  const latest = [...events].reverse().find((e) => e.participant || e.possessionType || e.action !== MatchAction.Unknown);
  const hot = isHot(latest);
  const attackingColor = latest?.participant === 2 ? awayColor : homeColor;

  // Ball follows the real feed position when live; otherwise it's biased toward the attacking side.
  const ballX = radar ? radar.ball.lat * 100 : ballXFor(latest) + jitter(7, match.minute, 3);
  const ballY = radar ? radar.ball.depth * 100 : ballYFor(latest, match.minute);

  return (
    <GlassPanel tone="blur" radius="lg" className={cn('pointer-events-none w-[210px] p-1.5', className)}>
      <div className="relative h-[112px] w-full overflow-hidden rounded-md border border-white/10 bg-[repeating-linear-gradient(90deg,#0d2417_0_9%,#0f2a1b_9%_18%)]">
        <div
          aria-hidden
          className={cn('absolute inset-y-0 w-1/2 opacity-0 transition-opacity duration-500', hot && 'opacity-30')}
          style={{
            left: latest?.participant === 1 ? '50%' : 0,
            background: `radial-gradient(circle at center, ${attackingColor} 0%, transparent 68%)`,
          }}
        />

        {/* Pitch markings. */}
        <div className="absolute inset-1.5 rounded-sm border border-white/10" />
        <div className="absolute inset-y-1.5 left-1/2 w-px -translate-x-1/2 bg-white/10" />
        <div className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1.5 h-10 w-4 -translate-y-1/2 border border-l-0 border-white/10" />
        <div className="absolute top-1/2 right-1.5 h-10 w-4 -translate-y-1/2 border border-r-0 border-white/10" />

        <MiniDots dots={dots} />

        {/* The ball. */}
        <span
          className={cn(
            'absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-all ease-linear',
            radar ? 'duration-100' : 'duration-1000 ease-in-out',
            hot
              ? 'size-2 animate-pulse shadow-[0_0_12px_rgba(174,240,25,0.95)] ring-2 ring-neon/50'
              : 'size-1.5 shadow-[0_0_6px_rgba(255,255,255,0.8)]',
          )}
          style={{
            left: `${ballX}%`,
            top: `${ballY}%`,
          }}
        />
      </div>
    </GlassPanel>
  );
}
