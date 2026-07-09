'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import Image from 'next/image';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { cn } from '@/lib/utils';
import { fifaToIso } from '@/lib/country';
import { teamInfoFromName } from '@/config/teams.config';
import { TeamSide } from '@/enums/team-side.enum';
import { useUpcomingFixtures } from '@/services/queries/use-replay';
import type { FixtureDto } from '@/services/txline.service';
import { heroMatch, type DashTeam, type HeroFigurePlacement } from '@/config/match-dashboard.config';

const { days, hours, minutes, seconds } = heroMatch.countdown;
const INITIAL = ((days * 24 + hours) * 60 + minutes) * 60 + seconds;

/** StartTime is epoch ms on the real API but seconds in the mock — normalise to ms. */
const toMs = (startTime: number) => (startTime < 1e12 ? startTime * 1000 : startTime);

/** Team identity for the card header — real name + flag-icons ISO code. */
interface HeroCardTeam {
  name: string;
  code: string;
}

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
export function HeroCardShell({
  children,
  home,
  away,
  label,
  targetMs,
}: {
  children?: ReactNode;
  home?: HeroCardTeam;
  away?: HeroCardTeam;
  label?: string;
  targetMs?: number;
}) {
  const h1 = home ?? { name: heroMatch.home.name, code: heroMatch.home.code };
  const a1 = away ?? { name: heroMatch.away.name, code: heroMatch.away.code };
  const heading = label ?? heroMatch.label;

  // Count down to the real kickoff (client-only so SSR never mismatches on wall-clock).
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const target = targetMs ?? Date.now() + INITIAL * 1000;
    const tick = () => setRemaining(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  const r = remaining ?? INITIAL;
  const d = Math.floor(r / 86400);
  const h = Math.floor((r % 86400) / 3600);
  const m = Math.floor((r % 3600) / 60);
  const s = r % 60;

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
          <Flag code={h1.code} className="text-base" />
          <span className="text-[15px] font-bold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            {h1.name} <span className="text-white/45">vs</span> {a1.name}
          </span>
          <Flag code={a1.code} className="text-base" />
        </div>
        <div className="text-xs text-white/55">{heading}</div>

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

/** Earliest fixture that hasn't kicked off yet (falls back to the first listed). */
function nextFixture(fixtures: FixtureDto[] | undefined): FixtureDto | undefined {
  if (!fixtures?.length) return undefined;
  const now = Date.now();
  const future = fixtures
    .filter((f) => toMs(f.StartTime) > now)
    .sort((a, b) => toMs(a.StartTime) - toMs(b.StartTime));
  return future[0] ?? fixtures[0];
}

const kickoffLabel = (ms: number) =>
  new Date(ms).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });

/** Featured "next match" hero — the upcoming fixture from the API, with a live kickoff countdown. */
export function MatchHeroCard({ placements }: { placements?: { home: HeroFigurePlacement; away: HeroFigurePlacement } }) {
  const homeP = placements?.home ?? heroMatch.home.placement;
  const awayP = placements?.away ?? heroMatch.away.placement;

  const { data: fixtures } = useUpcomingFixtures();
  const next = nextFixture(fixtures);

  // Real identity + flag (SVG) for the upcoming fixture; undefined falls back to the config default.
  const home = next
    ? { name: next.Participant1, code: fifaToIso(teamInfoFromName(next.Participant1, TeamSide.Home).code) }
    : undefined;
  const away = next
    ? { name: next.Participant2, code: fifaToIso(teamInfoFromName(next.Participant2, TeamSide.Away).code) }
    : undefined;
  const targetMs = next ? toMs(next.StartTime) : undefined;
  const label = next ? kickoffLabel(toMs(next.StartTime)) : undefined;

  return (
    <HeroCardShell home={home} away={away} label={label} targetMs={targetMs}>
      <HeroFigure team={heroMatch.home} side="home" placement={homeP} />
      <HeroFigure team={heroMatch.away} side="away" placement={awayP} />
    </HeroCardShell>
  );
}
