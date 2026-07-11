'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { formationDots, formationFor, type FormationDot } from '@/config/team-lineups.config';
import { teamColor } from '@/config/team-colors.config';
import { MatchAction } from '@/enums/match-action.enum';
import { fifaToIso } from '@/lib/country';
import { useDisplayEvents, useDisplayMatch } from '@/store/match.store';
import type { MatchEventPayload } from '@/types/match';
import { cn } from '@/lib/utils';

/** Deterministic per-dot jitter so the radar feels alive without real tracking. */
function jitter(seed: number, minute: number, axis: number): number {
  const n = Math.imul(seed * 31 + minute * 7 + axis * 13, 2654435761) >>> 0;
  return ((n % 500) / 100 - 2.5) * 0.9; // ±2.25% drift
}

function MiniDots({ dots, color, minute, seedBase }: { dots: FormationDot[]; color: string; minute: number; seedBase: number }) {
  return (
    <>
      {dots.map((dot) => (
        <span
          key={`${seedBase}-${dot.number}`}
          className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-black/40 transition-all duration-1000 ease-in-out"
          style={{
            left: `${dot.x + jitter(seedBase + dot.number, minute, 1)}%`,
            top: `${dot.y + jitter(seedBase + dot.number, minute, 2)}%`,
            backgroundColor: color,
          }}
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
 * The mini watcher — a compact 2D radar of the pitch with both teams' dots and
 * the ball, drifting subtly with the clock. Formation-based (the feed carries no
 * tracking), with the ball biased toward the attacking side in possession.
 */
export function RoomMiniPitch({ className }: { className?: string }) {
  const match = useDisplayMatch();
  const events = useDisplayEvents();

  const homeColor = teamColor(fifaToIso(match.home.code));
  const awayColor = teamColor(fifaToIso(match.away.code));
  const homeDots = formationDots(formationFor(match.home.code), 'home');
  const awayDots = formationDots(formationFor(match.away.code), 'away');

  const latest = [...events].reverse().find((e) => e.participant || e.possessionType || e.action !== MatchAction.Unknown);
  const ballX = ballXFor(latest);
  const hot = isHot(latest);
  const attackingColor = latest?.participant === 2 ? awayColor : homeColor;

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

        <MiniDots dots={homeDots} color={homeColor} minute={match.minute} seedBase={100} />
        <MiniDots dots={awayDots} color={awayColor} minute={match.minute} seedBase={200} />

        {/* The ball. */}
        <span
          className={cn(
            'absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-all duration-1000 ease-in-out',
            hot
              ? 'size-2 animate-pulse shadow-[0_0_12px_rgba(174,240,25,0.95)] ring-2 ring-neon/50'
              : 'size-1.5 shadow-[0_0_6px_rgba(255,255,255,0.8)]',
          )}
          style={{
            left: `${ballX + jitter(7, match.minute, 3)}%`,
            top: `${ballYFor(latest, match.minute)}%`,
          }}
        />
      </div>
    </GlassPanel>
  );
}
