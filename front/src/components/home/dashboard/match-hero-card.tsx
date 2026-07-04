'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import Image from 'next/image';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { cn } from '@/lib/utils';
import { heroMatch, type DashTeam, type HeroFigurePlacement } from '@/config/match-dashboard.config';

const { days, hours, minutes, seconds } = heroMatch.countdown;
const INITIAL = ((days * 24 + hours) * 60 + minutes) * 60 + seconds;

/** Inline style that positions a hero figure from its placement — shared by the card + the editor. */
export function heroFigureStyle(side: 'home' | 'away', p: HeroFigurePlacement): CSSProperties {
  return {
    width: p.width,
    objectPosition: `50% ${p.objectY}%`,
    transform: `translate(${p.x}px, ${p.y}px) scale(${p.scale}) scaleX(${p.flip ? -1 : 1})`,
    transformOrigin: side === 'home' ? 'left bottom' : 'right bottom',
  };
}

const FIGURE_BASE = 'absolute bottom-0 h-full object-cover drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]';

interface HeroFigureProps {
  team: DashTeam;
  side: 'home' | 'away';
  placement: HeroFigurePlacement;
  /** Editor mode — the figure becomes draggable to set x/y. */
  editable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onMove?: (x: number, y: number) => void;
}

/** One positioned pixel-art figure. Draggable when `editable`. */
export function HeroFigure({ team, side, placement, editable, selected, onSelect, onMove }: HeroFigureProps) {
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLImageElement>) => {
    if (!editable) return;
    onSelect?.();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: placement.x, oy: placement.y };
  };
  const onPointerMove = (e: PointerEvent<HTMLImageElement>) => {
    const d = drag.current;
    if (!d) return;
    onMove?.(Math.round(d.ox + (e.clientX - d.sx)), Math.round(d.oy + (e.clientY - d.sy)));
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <Image
      src={team.portraitSrc}
      alt={team.name}
      width={220}
      height={360}
      priority
      draggable={false}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        FIGURE_BASE,
        side === 'home' ? 'left-0' : 'right-0',
        editable ? 'cursor-grab touch-none active:cursor-grabbing' : 'pointer-events-none',
        selected && 'outline outline-2 outline-neon',
      )}
      style={heroFigureStyle(side, placement)}
    />
  );
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-2xl font-bold tabular-nums text-white sm:text-[28px]">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-eyebrow text-white/60">{label}</span>
    </div>
  );
}

/** The hero card frame — pitch/beams backdrop + centered title & countdown. Figures render as
 *  children (behind the title); the centered content never intercepts pointer events, so figures
 *  stay draggable in the editor. */
export function HeroCardShell({ children }: { children?: ReactNode }) {
  const [remaining, setRemaining] = useState(INITIAL);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(id);
  }, [remaining]);

  const d = Math.floor(remaining / 86400);
  const h = Math.floor((remaining % 86400) / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <GlassPanel tone="surface" radius="xl" className="relative h-[190px] overflow-hidden p-0">
      <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_120%,#12160f_0%,#0a0c0a_60%,#070807_100%)]" />

      {/* Angled colour beams — blue over the home half, green over the away half. */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1/2 bg-cover bg-left-top bg-no-repeat opacity-95 mix-blend-screen"
        style={{ backgroundImage: 'url(/cards/beam-blue.svg)' }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-right-top bg-no-repeat opacity-95 mix-blend-screen"
        style={{ backgroundImage: 'url(/cards/beam-green.svg)' }}
      />
      {/* Soft central shade so the title/countdown stay legible over the beams. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(50%_85%_at_50%_50%,rgba(4,6,4,0.55)_0%,transparent_70%)]"
      />

      {children}

      <div className="pointer-events-none relative flex h-full flex-col items-center justify-center gap-0.5 text-center">
        <div className="flex items-center gap-2">
          <Flag code={heroMatch.home.code} className="text-base" />
          <span className="text-[15px] font-bold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            {heroMatch.home.name} <span className="text-white/45">vs</span> {heroMatch.away.name}
          </span>
          <Flag code={heroMatch.away.code} className="text-base" />
        </div>
        <div className="text-xs text-white/55">{heroMatch.label}</div>

        <div className="mt-2.5 flex items-start gap-3 rounded-xl bg-black/45 px-4 py-2 ring-1 ring-white/10 backdrop-blur-md">
          <CountUnit value={d} label="Days" />
          <span className="pt-1 text-xl font-bold text-white/40">:</span>
          <CountUnit value={h} label="Hours" />
          <span className="pt-1 text-xl font-bold text-white/40">:</span>
          <CountUnit value={m} label="Minutes" />
          <span className="pt-1 text-xl font-bold text-white/40">:</span>
          <CountUnit value={s} label="Seconds" />
        </div>
      </div>
    </GlassPanel>
  );
}

/** Featured match hero — two pixel-art players over a pitch, with a kickoff countdown. */
export function MatchHeroCard({ placements }: { placements?: { home: HeroFigurePlacement; away: HeroFigurePlacement } }) {
  const homeP = placements?.home ?? heroMatch.home.placement;
  const awayP = placements?.away ?? heroMatch.away.placement;

  return (
    <HeroCardShell>
      <HeroFigure team={heroMatch.home} side="home" placement={homeP} />
      <HeroFigure team={heroMatch.away} side="away" placement={awayP} />
    </HeroCardShell>
  );
}
