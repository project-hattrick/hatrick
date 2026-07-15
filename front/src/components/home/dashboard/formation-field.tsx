'use client';

import type { CSSProperties } from 'react';

import { formationDots, formationFor, type FormationDot } from '@/config/team-lineups.config';
import { useDashboardMatch } from './use-dashboard-match';

const HOME_COLOR = '#e5484d';
const AWAY_COLOR = '#e2b33c';

/** Flat pitch markings (x/y/size in %). Home defends the top goal, away the bottom. */
const MARKS: CSSProperties[] = [
  { left: '3%', right: '3%', top: '5%', bottom: '5%' }, // touchlines
  { left: '24%', right: '24%', top: '5%', height: '14%' }, // top penalty box
  { left: '24%', right: '24%', bottom: '5%', height: '14%' }, // bottom penalty box
  { left: '38%', right: '38%', top: '5%', height: '6.5%' }, // top goal box
  { left: '38%', right: '38%', bottom: '5%', height: '6.5%' }, // bottom goal box
  { left: '50%', top: '50%', width: '30%', height: '16%', transform: 'translate(-50%, -50%)', borderRadius: '50%' }, // centre circle
];

function Dots({ dots, color }: { dots: FormationDot[]; color: string }) {
  return (
    <>
      {dots.map((dot) => (
        <div
          key={`${color}-${dot.number}`}
          className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-mono text-micro font-bold text-white shadow-e2 ring-2 ring-black/30"
          style={{ left: `${dot.y}%`, top: `${dot.x}%`, backgroundColor: color }}
        >
          {dot.number}
        </div>
      ))}
    </>
  );
}

/**
 * Flat top-down formation pitch for the line-up card: both sides' tactical shape on one vertical
 * pitch, with each team's flag faintly painted on its half. Positions are a curated template per team
 * (the live feed carries per-player positionId, not a team formation), so this is illustrative.
 */
export function FormationField() {
  const match = useDashboardMatch();
  const homeShape = formationFor(match.home.code);
  const awayShape = formationFor(match.away.code);

  return (
    <div className="relative mx-auto min-h-[320px] w-full max-w-[420px] flex-1 overflow-hidden rounded-xl border border-white/10 bg-[repeating-linear-gradient(0deg,#0d2417_0_9%,#0f2a1b_9%_18%)]">
      {/* faint team flags painted on each half */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-cover bg-center opacity-[0.13] fi-${match.home.iso.toLowerCase()}`}
      />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-cover bg-center opacity-[0.13] fi-${match.away.iso.toLowerCase()}`}
      />

      {/* pitch markings */}
      {MARKS.map((style, i) => (
        <div key={i} className="pointer-events-none absolute border-2 border-white/20" style={style} />
      ))}
      <div className="pointer-events-none absolute inset-x-[3%] top-1/2 h-px -translate-y-1/2 bg-white/20" />
      <div className="pointer-events-none absolute left-1/2 top-[5%] h-1.5 w-[22%] -translate-x-1/2 rounded-b-sm bg-white/25" />
      <div className="pointer-events-none absolute bottom-[5%] left-1/2 h-1.5 w-[22%] -translate-x-1/2 rounded-t-sm bg-white/25" />

      <Dots dots={formationDots(homeShape, 'home')} color={HOME_COLOR} />
      <Dots dots={formationDots(awayShape, 'away')} color={AWAY_COLOR} />
    </div>
  );
}
