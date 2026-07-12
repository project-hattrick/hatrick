import type { ReactNode } from 'react';

import { GlassPanel } from '@/components/common/glass-panel';
import { cn } from '@/lib/utils';

/**
 * Layout comparison lab for the home MatchDashboard. Renders the four candidate skeletons with
 * labelled placeholder slots (no live data) so the distribution can be judged side by side. The
 * tactical pitch is a landscape band in every variant — that's the fix for the "giant formation"
 * bug where a `flex-1` pitch stretched to match the tall right column.
 */

const HOME = '#e5484d';
const AWAY = '#e2b33c';

// A rough 4-3-3 spread per side so the pitch reads as 11v11 on one landscape field (mirrored).
const HOME_DOTS: Array<[number, number]> = [
  [7, 50], [20, 24], [20, 50], [20, 76], [34, 32], [34, 68], [34, 50], [45, 18], [45, 82], [45, 50],
];
const AWAY_DOTS: Array<[number, number]> = [
  [93, 50], [80, 24], [80, 50], [80, 76], [66, 32], [66, 68], [66, 50], [55, 18], [55, 82], [55, 50],
];

function SlotHead({ label, role }: { label: string; role?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs font-bold text-foreground">{label}</span>
      {role ? <span className="truncate text-micro text-muted-foreground">{role}</span> : null}
    </div>
  );
}

/** A neutral placeholder widget — header + a few skeleton bars, so any section reads as "content here". */
function Slot({
  label,
  role,
  lines = 3,
  className,
}: {
  label: string;
  role?: string;
  lines?: number;
  className?: string;
}) {
  const widths = ['92%', '78%', '85%', '64%', '88%', '72%'];
  return (
    <GlassPanel tone="surface" radius="xl" className={cn('flex flex-col gap-2.5 p-3', className)}>
      <SlotHead label={label} role={role} />
      <div className="flex flex-1 flex-col justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-overlay/15 p-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-2 rounded-full bg-foreground/10" style={{ width: widths[i % widths.length] }} />
        ))}
      </div>
    </GlassPanel>
  );
}

function Dot({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <div
      className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-black/40"
      style={{ left: `${x}%`, top: `${y}%`, backgroundColor: color }}
    />
  );
}

/** The tactical pitch, landscape. `aspect` keeps it from ever stretching vertically; `fill` makes it
 *  fill a fixed-height band instead (used by the tactical-left variant). */
function PitchSlot({
  aspect = 'aspect-[16/7]',
  fill,
  className,
}: {
  aspect?: string;
  fill?: boolean;
  className?: string;
}) {
  return (
    <GlassPanel tone="surface" radius="xl" className={cn('flex flex-col gap-2.5 p-3', className)}>
      <SlotHead label="Tactical Pitch" role="both teams · landscape" />
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-xl border border-white/10 bg-[repeating-linear-gradient(90deg,#0d2417_0_9%,#0f2a1b_9%_18%)]',
          fill ? 'min-h-[200px] flex-1' : cn('w-full', aspect),
        )}
      >
        <div className="pointer-events-none absolute inset-2 rounded-md border border-white/10" />
        <div className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-white/10" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        {HOME_DOTS.map(([x, y], i) => (
          <Dot key={`h-${i}`} x={x} y={y} color={HOME} />
        ))}
        {AWAY_DOTS.map(([x, y], i) => (
          <Dot key={`a-${i}`} x={x} y={y} color={AWAY} />
        ))}
      </div>
    </GlassPanel>
  );
}

/** The hero banner — score + timer over the team-tinted beams (no figures in the skeleton). */
function HeroSlot({ className }: { className?: string }) {
  return (
    <GlassPanel tone="surface" radius="xl" className={cn('flex flex-col gap-2.5 p-3', className)}>
      <SlotHead label="Match Hero" role="figures · score · timer" />
      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(120%_140%_at_50%_120%,#12160f_0%,#0a0c0a_60%,#070807_100%)]">
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-3/5 opacity-70 mix-blend-screen"
          style={{ background: `linear-gradient(108deg, ${HOME} 0%, transparent 68%)` }}
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-3/5 opacity-70 mix-blend-screen"
          style={{ background: `linear-gradient(252deg, ${AWAY} 0%, transparent 68%)` }}
        />
        <div className="relative flex flex-col items-center gap-1 py-4">
          <span className="inline-flex items-center gap-1.5 font-mono text-micro font-bold text-live">
            <span className="size-1.5 animate-pulse rounded-full bg-live" /> LIVE
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums text-white">
            ESP <span className="text-white/40">2 - 1</span> BEL
          </span>
          <span className="font-mono text-xs text-white/60">67:24</span>
        </div>
      </div>
    </GlassPanel>
  );
}

function Rail({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

/** A — Broadcast (ref Image #1): hero + stats on top, big pitch + events/odds rail, analytics strip. */
function LayoutBroadcast() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <HeroSlot className="min-h-[160px]" />
        <Slot label="Team Stats" role="8 lines" lines={5} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <PitchSlot />
        <Rail>
          <Slot label="Key Events" role="goals · cards" className="flex-1" />
          <Slot label="Live Odds" role="1 · X · 2 · O/U" lines={2} className="flex-1" />
        </Rail>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Slot label="Momentum" />
        <Slot label="Shots Map" />
        <Slot label="Passing Network" />
        <Slot label="Standings" lines={4} />
      </div>
    </div>
  );
}

/** B — Betting-forward (variant D): hero + summary, pitch + players/odds/bet-builder rail, then fixtures. */
function LayoutBetting() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <HeroSlot className="min-h-[140px]" />
        <Slot label="Match Summary" role="poss · shots · acc" lines={4} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <PitchSlot />
        <Rail>
          <Slot label="Key Players" role="ratings" className="flex-1" />
          <Slot label="Live Odds" role="1 · X · 2" lines={2} className="flex-1" />
          <Slot label="Bet Builder" role="add to slip" lines={2} className="flex-1" />
        </Rail>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Slot label="Momentum" />
        <Slot label="Shots Map" />
        <Slot label="Passing Network" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Slot label="Standings" lines={4} />
        <Slot label="Next Fixtures" lines={3} />
      </div>
    </div>
  );
}

/** C — Tactical-left (variant B): pitch anchors the left, hero+score centre, stats rail; then analytics. */
function LayoutTacticalLeft() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:h-[380px] lg:grid-cols-[1.25fr_1fr_290px]">
        <PitchSlot fill className="h-full" />
        <Rail>
          <HeroSlot className="flex-1" />
          <Slot label="Score / Timer" role="ESP 2-1 · 67'" lines={2} className="flex-1" />
        </Rail>
        <Rail>
          <Slot label="Team Stats" lines={3} className="flex-1" />
          <Slot label="Key Events" lines={3} className="flex-1" />
          <Slot label="Live Odds" lines={2} className="flex-1" />
        </Rail>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr_1.3fr]">
        <Slot label="Momentum" />
        <Slot label="Shots Map" />
        <Slot label="Passing Network" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Slot label="Lineups" lines={4} />
        <Slot label="Standings" lines={4} />
      </div>
    </div>
  );
}

/** D — Fix in place (minimal): keep the two columns, but cap the pitch to 16/9 so it never stretches. */
function LayoutFixInPlace() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <HeroSlot className="min-h-[150px]" />
          <PitchSlot aspect="aspect-[16/9]" />
        </div>
        <Rail>
          <Slot label="Live Match" role="score · 3 stats" />
          <Slot label="Team Stats" lines={4} />
          <Slot label="Upcoming Odds" lines={2} />
          <Slot label="My Bets" lines={2} />
          <Slot label="Team Lineup" lines={4} className="flex-1" />
        </Rail>
      </div>
      <Slot label="Group Standings" lines={4} />
    </div>
  );
}

const VARIANTS = [
  {
    tag: 'A',
    title: 'Broadcast',
    desc: 'Closest to your main ref. Hero + Team Stats, then a big landscape pitch with a Key Events / Live Odds rail, then an analytics strip. Needs 2–3 new small widgets.',
    render: <LayoutBroadcast />,
  },
  {
    tag: 'B',
    title: 'Betting-forward',
    desc: 'Betting focus. Hero + Match Summary, pitch with a Key Players / Live Odds / Bet Builder rail, analytics row, then Standings + Next Fixtures.',
    render: <LayoutBetting />,
  },
  {
    tag: 'C',
    title: 'Tactical-left',
    desc: 'Pitch anchors the left as the centrepiece, hero + score in the middle, Team Stats rail on the right; analytics + Lineups/Standings below.',
    render: <LayoutTacticalLeft />,
  },
  {
    tag: 'D',
    title: 'Fix in place (minimal)',
    desc: 'Keep the current two columns, but cap the pitch to a 16/9 landscape so it stops stretching. No new widgets — fastest, least like the ref.',
    render: <LayoutFixInPlace />,
  },
];

/** The full comparison page. */
export function DashboardLayoutLab() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-eyebrow font-bold uppercase tracking-wider text-neon">Layout Lab</span>
        <h1 className="text-2xl font-bold">Home dashboard — structure options</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Four candidate skeletons for the below-hero MatchDashboard, sections only (no live data). The
          tactical pitch is a landscape band in every one, so it never blows up to fill the tall rail like
          it does today. Pick the structure and I&apos;ll wire the real widgets into it.
        </p>
      </header>

      {VARIANTS.map((variant) => (
        <section key={variant.tag} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-neon text-base font-bold text-primary-foreground">
              {variant.tag}
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold">{variant.title}</span>
              <span className="max-w-3xl text-xs text-muted-foreground">{variant.desc}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/40 p-4">{variant.render}</div>
        </section>
      ))}
    </div>
  );
}
