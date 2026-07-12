'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { formationDots, formationFor, type FormationDot } from '@/config/team-lineups.config';
import { useDashboardMatch } from './use-dashboard-match';

/**
 * "Passing Network" — each side's XI as nodes on one pitch, linked to their two nearest team-mates so the
 * shape reads as a passing web. Nodes come straight from the shared `formationDots`, so the network always
 * matches the Team Formation card. SVG viewBox is 100×50 to match the 2:1 pitch (nodes stay round).
 */

const HOME_COLOR = '#e5484d';
const AWAY_COLOR = '#e2b33c';

/** Undirected links to each node's two nearest team-mates, de-duplicated. */
function nearestLinks(dots: FormationDot[]): Array<[FormationDot, FormationDot]> {
  const seen = new Set<string>();
  const links: Array<[FormationDot, FormationDot]> = [];
  dots.forEach((a, i) => {
    dots
      .map((b, j) => ({ b, j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2)
      .forEach(({ b, j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        links.push([a, b]);
      });
  });
  return links;
}

function Web({ dots, color }: { dots: FormationDot[]; color: string }) {
  const links = nearestLinks(dots);
  return (
    <>
      {links.map(([a, b], i) => (
        <line key={`l-${i}`} x1={a.x} y1={a.y * 0.5} x2={b.x} y2={b.y * 0.5} stroke={color} strokeWidth={0.4} strokeOpacity={0.5} />
      ))}
      {dots.map((d) => (
        <circle key={`n-${d.number}`} cx={d.x} cy={d.y * 0.5} r={2.2} fill={color} stroke="#0008" strokeWidth={0.4} />
      ))}
    </>
  );
}

export function PassingNetworkCard() {
  const match = useDashboardMatch();
  const homeDots = formationDots(formationFor(match.home.code), 'home');
  const awayDots = formationDots(formationFor(match.away.code), 'away');

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-3 p-4">
      <span className="text-sm font-bold">Passing Network</span>

      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border border-white/10 bg-[repeating-linear-gradient(90deg,#0d2417_0_9%,#0f2a1b_9%_18%)]">
        <div className="pointer-events-none absolute inset-2 rounded-md border border-white/10" />
        <div className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-white/10" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          <Web dots={homeDots} color={HOME_COLOR} />
          <Web dots={awayDots} color={AWAY_COLOR} />
        </svg>
      </div>

      <div className="flex items-center justify-center gap-4 text-micro font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: HOME_COLOR }} />{match.home.name}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: AWAY_COLOR }} />{match.away.name}</span>
      </div>
    </GlassPanel>
  );
}
