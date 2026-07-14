'use client';

import type { CSSProperties } from 'react';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { formationDots, formationFor, type FormationDot } from '@/config/team-lineups.config';
import { useDashboardMatch } from './use-dashboard-match';

const HOME_COLOR = '#e5484d';
const AWAY_COLOR = '#e2b33c';

/** Players lie on the flat field; the portrait pitch has goals at top & bottom, so we map the
 *  horizontal formation template onto the vertical field (its long axis becomes depth). */
function Players({ dots, color }: { dots: FormationDot[]; color: string }) {
  return (
    <>
      {dots.map((dot) => (
        <div
          key={`${color}-${dot.number}`}
          className="ftw3d__player"
          style={{ left: `${dot.y}%`, top: `${dot.x}%` }}
        >
          <span className="ftw3d__shadow" />
          <span className="ftw3d__chip" style={{ '--chip': color } as CSSProperties}>
            {dot.number}
          </span>
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
 * "Team Formation" — both sides' tactical shape on a 3D CSS-transform football field (faithful port of
 * the reference pen: a flat pitch inside a receding world, 3D mud sides, painted markings, players
 * standing upright via a counter-rotation). Positions are a curated template per team (the live feed
 * carries no coordinates), so this reads as an illustrative shape, not a tracking view.
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

      <div className="relative h-[380px] w-full overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(120%_100%_at_50%_-10%,#123524_0%,#0a1a12_55%,#060f0a_100%)]">
        <div className="ftw3d">
          <div className="ftw3d__scale">
            <div className="ftw3d__world">
              <div className="ftw3d__terrain">
                <div className="ftw3d__field">
                  <div className="ftw3d__grass" />
                  <div className="ftw3d__gradient" />
                  <div className="ftw3d__line ftw3d__line--outline" />
                  <div className="ftw3d__line ftw3d__line--mid" />
                  <div className="ftw3d__line ftw3d__line--circle" />
                  <div className="ftw3d__line ftw3d__line--goal" />
                  <div className="ftw3d__line ftw3d__line--goal ftw3d__line--goal-far" />
                  <div className="ftw3d__line ftw3d__line--penalty" />
                  <div className="ftw3d__line ftw3d__line--penalty ftw3d__line--penalty-far" />
                  <div className="ftw3d__line ftw3d__line--arc" />
                  <div className="ftw3d__line ftw3d__line--arc ftw3d__line--arc-far" />
                  <Players dots={formationDots(homeShape, 'home')} color={HOME_COLOR} />
                  <Players dots={formationDots(awayShape, 'away')} color={AWAY_COLOR} />
                </div>
                <div className="ftw3d__side ftw3d__side--front" />
                <div className="ftw3d__side ftw3d__side--left" />
                <div className="ftw3d__side ftw3d__side--right" />
                <div className="ftw3d__side ftw3d__side--back" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
