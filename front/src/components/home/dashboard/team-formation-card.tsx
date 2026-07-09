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
          className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-micro font-bold text-white shadow-e2 ring-2 ring-black/30 sm:size-7 sm:text-xs"
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
    <div className={align === 'right' ? 'flex flex-row-reverse items-center gap-2 text-right' : 'flex items-center gap-2'}>
      <Flag code={code} className="text-base" />
      <div className={align === 'right' ? 'flex flex-col items-end' : 'flex flex-col'}>
        <span className="text-xs font-bold">{name}</span>
        <span className="font-mono text-micro text-muted-foreground">{shape}</span>
      </div>
    </div>
  );
}

/** "Team Formation" — both line-ups on one horizontal pitch, shape + dots derived from the selected match. */
export function TeamFormationCard() {
  const match = useDashboardMatch();
  const homeShape = formationFor(match.home.code);
  const awayShape = formationFor(match.away.code);

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-1 flex-col gap-3 p-4">
      <span className="text-sm font-bold">Team Formation</span>

      <div className="flex items-center justify-between">
        <TeamTag name={match.home.name} shape={homeShape} code={match.home.iso} />
        <span className="font-mono text-micro font-bold text-muted-foreground">FT</span>
        <TeamTag name={match.away.name} shape={awayShape} code={match.away.iso} align="right" />
      </div>

      <div className="relative min-h-[220px] w-full flex-1 overflow-hidden rounded-xl border border-white/10 bg-[repeating-linear-gradient(90deg,#0d2417_0_9%,#0f2a1b_9%_18%)]">
        <div className="pointer-events-none absolute inset-2 rounded-md border border-white/10" />
        <div className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-white/10" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <Dots dots={formationDots(homeShape, 'home')} color={HOME_COLOR} />
        <Dots dots={formationDots(awayShape, 'away')} color={AWAY_COLOR} />
      </div>
    </GlassPanel>
  );
}
