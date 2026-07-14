'use client';

import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';

import { formationDots, formationFor, type FormationDot } from '@/config/team-lineups.config';
import { cn } from '@/lib/utils';
import { useDashboardMatch } from './use-dashboard-match';

const HOME_COLOR = '#e5484d';
const AWAY_COLOR = '#e2b33c';

// Camera-tilt limits (deg) for the drag orbit.
const RX_MIN = -46;
const RX_MAX = 40;
const RY_MIN = -55;
const RY_MAX = 55;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

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

/**
 * The 3D CSS-transform football field for the line-up card: a flat pitch inside a receding world with
 * 3D mud sides, painted markings, standing players, and each team's flag faintly painted on its half.
 * Drag to orbit the camera (vertical tilts, horizontal spins). Positions are a curated template per
 * team (the live feed carries per-player positionId, not a team formation), so this is illustrative.
 */
export function FormationField() {
  const match = useDashboardMatch();
  const homeShape = formationFor(match.home.code);
  const awayShape = formationFor(match.away.code);

  const [rot, setRot] = useState({ rx: 0, ry: 0 });
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, y: 0, rx: 0, ry: 0 });

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, rx: rot.rx, ry: rot.ry };
    setDragging(true);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    setRot({
      rx: clamp(start.current.rx - dy * 0.35, RX_MIN, RX_MAX),
      ry: clamp(start.current.ry + dx * 0.35, RY_MIN, RY_MAX),
    });
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(120%_100%_at_50%_-10%,#123524_0%,#0a1a12_55%,#060f0a_100%)]">
      <div
        className={cn('ftw3d', dragging && 'is-dragging')}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="ftw3d__scale">
          <div
            className="ftw3d__tilt"
            style={{ '--ftw-rx': `${rot.rx}deg`, '--ftw-ry': `${rot.ry}deg` } as CSSProperties}
          >
            <div className="ftw3d__world">
              <div className="ftw3d__terrain">
                <div className="ftw3d__field">
                  <div className="ftw3d__grass" />
                  <div className="ftw3d__gradient" />
                  <div className={`ftw3d__flag ftw3d__flag--home fi-${match.home.iso.toLowerCase()}`} />
                  <div className={`ftw3d__flag ftw3d__flag--away fi-${match.away.iso.toLowerCase()}`} />
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

      <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-2 py-0.5 font-mono text-micro text-white/60">
        drag to rotate
      </span>
    </div>
  );
}
