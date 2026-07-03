'use client';

import { useState } from 'react';
import Image from 'next/image';
import { GlassPanel } from '@/components/common/glass-panel';
import { CaretDown, CaretLeft, CaretRight } from '@/components/common/icons';
import { cn } from '@/lib/utils';
import { focusAt, type FocusPlayer } from '@/config/live-roster.config';
import { useUiStore } from '@/store/ui.store';

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular rating ring filled proportionally to the player's rating (0–100), portrait inside. */
function RatingRing({ rating, portraitSrc, name }: { rating: number; portraitSrc: string; name: string }) {
  const offset = CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, rating / 100)));
  return (
    <div className="relative mx-auto grid size-[88px] place-items-center text-neon">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="currentColor" strokeOpacity={0.16} strokeWidth={7} />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-all duration-[var(--duration-base)] ease-soft"
        />
      </svg>
      <span className="absolute grid size-[62px] place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-1 ring-1 ring-white/10">
        <Image
          src={portraitSrc}
          alt={name}
          width={62}
          height={62}
          className="translate-y-[8%] scale-110 object-contain object-bottom"
          style={{ imageRendering: 'pixelated' }}
        />
      </span>
      <span className="absolute right-0 bottom-0 grid size-7 place-items-center rounded-full border-2 border-neon bg-surface-1 text-xs font-bold text-neon">
        {rating}
      </span>
    </div>
  );
}

function StatCell({ value, label, highlight }: { value: string | number; label: string; highlight?: boolean }) {
  return (
    <div className={cn('flex-1 rounded-md py-1.5 text-center', highlight ? 'bg-neon/15' : 'bg-foreground/5')}>
      <div className={cn('font-mono text-sm font-bold', highlight ? 'text-neon' : 'text-foreground')}>{value}</div>
      <div className="font-mono text-[7px] font-bold tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

/** "On the ball" focus card — minimalist by default, expands to the player's live stats. */
export function PlayerFocusCard() {
  const focusedPlayerIndex = useUiStore((s) => s.focusedPlayerIndex);
  const focusNext = useUiStore((s) => s.focusNext);
  const focusPrev = useUiStore((s) => s.focusPrev);
  const [expanded, setExpanded] = useState(false);
  const { player, position, total }: { player: FocusPlayer; position: number; total: number } =
    focusAt(focusedPlayerIndex);

  return (
    <GlassPanel tone="surface" className="p-3 text-left md:p-3.5">
      {/* Always-visible minimalist header. */}
      <div className="flex items-center gap-2">
        <span className={cn('size-1.5 rounded-full', player.onBall ? 'bg-neon' : 'bg-muted-foreground')} />
        <span className="mr-auto font-mono text-[9px] font-bold tracking-wider text-muted-foreground">
          {player.onBall ? 'ON THE BALL' : 'FOCUS'}
        </span>
        <span className="font-mono text-[9px] font-bold text-muted-foreground/70">{player.code}</span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse player stats' : 'Expand player stats'}
          className="grid size-5 place-items-center rounded text-muted-foreground transition hover:text-foreground"
        >
          <CaretDown className={cn('size-3.5 transition-transform duration-300', expanded && 'rotate-180')} />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2.5">
        <span className="relative grid size-9 shrink-0 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-1 ring-1 ring-white/10">
          <Image
            src={player.portraitSrc}
            alt={player.name}
            width={36}
            height={36}
            className="translate-y-[8%] scale-110 object-contain object-bottom"
            style={{ imageRendering: 'pixelated' }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-foreground">{player.name}</div>
          <div className="truncate text-[9px] font-semibold text-muted-foreground">{player.team} · {player.position}</div>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-neon bg-surface-1 font-mono text-xs font-bold text-neon">
          {player.rating}
        </span>
      </div>

      {/* Expandable region — height animates via the grid-rows 0fr→1fr trick (no deps). */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-soft',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-3 text-center">
            <RatingRing rating={player.rating} portraitSrc={player.portraitSrc} name={player.name} />
          </div>

          <div className="mt-3 flex gap-1.5">
            <StatCell value={player.pass} label="PASS" />
            <StatCell value={player.touches} label="TCH" />
            <StatCell value={player.goals} label="GOALS" highlight />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous player"
              onClick={focusPrev}
              className="grid h-8 w-10 place-items-center rounded-lg border border-white/15 bg-foreground/5 text-foreground transition hover:bg-foreground/10"
            >
              <CaretLeft className="size-4" />
            </button>
            <span className="font-mono text-[10px] font-bold tracking-wider text-muted-foreground">
              {position} / {total}
            </span>
            <button
              type="button"
              aria-label="Next player"
              onClick={focusNext}
              className="grid h-8 w-10 place-items-center rounded-lg border border-white/15 bg-foreground/5 text-foreground transition hover:bg-foreground/10"
            >
              <CaretRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
