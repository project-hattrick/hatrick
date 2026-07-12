'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { formationDots, formationFor, type FormationDot } from '@/config/team-lineups.config';
import { useDashboardMatch } from './use-dashboard-match';

const HOME_COLOR = '#e5484d';
const AWAY_COLOR = '#e2b33c';

function Dots({ dots, color }: { dots: FormationDot[]; color: string }) {
  return (
    <>
      {dots.map((dot) => (
        <div
          key={`${color}-${dot.number}`}
          className="absolute grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-micro font-bold text-white shadow-e2 ring-2 ring-black/30"
          style={{ left: `${dot.x}%`, top: `${dot.y}%`, backgroundColor: color }}
        >
          {dot.number}
        </div>
      ))}
    </>
  );
}

function TeamTag({ name, shape, code, align }: { name: string; shape: string; code: string; align?: 'right' }) {
  return (
    <div className={align === 'right' ? 'flex flex-row-reverse items-center gap-1.5 text-right' : 'flex items-center gap-1.5'}>
      <Flag code={code} className="text-sm" />
      <div className={align === 'right' ? 'flex flex-col items-end' : 'flex flex-col'}>
        <span className="text-micro font-bold">{name}</span>
        <span className="font-mono text-micro text-muted-foreground">{shape}</span>
      </div>
    </div>
  );
}

/**
 * "Team Formation" — a compact tactical shape for both sides on one landscape pitch. Positions are a
 * curated template per team (the live feed carries no player coordinates), so this reads as an
 * illustrative shape, not a tracking view — hence a small tile rather than the dashboard centrepiece.
 */
export function TeamFormationCard() {
  const match = useDashboardMatch();
  const homeShape = formationFor(match.home.code);
  const awayShape = formationFor(match.away.code);

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">Team Formation</span>
        <span className="font-mono text-micro font-semibold text-muted-foreground uppercase">Shape</span>
      </div>

      <div className="flex items-center justify-between">
        <TeamTag name={match.home.name} shape={homeShape} code={match.home.iso} />
        <TeamTag name={match.away.name} shape={awayShape} code={match.away.iso} align="right" />
      </div>

      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-[repeating-linear-gradient(90deg,#0d2417_0_9%,#0f2a1b_9%_18%)]">
        <div className="pointer-events-none absolute inset-2 rounded-md border border-white/10" />
        <div className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-white/10" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <Dots dots={formationDots(homeShape, 'home')} color={HOME_COLOR} />
        <Dots dots={formationDots(awayShape, 'away')} color={AWAY_COLOR} />
      </div>
    </GlassPanel>
  );
}
