'use client';

import type { ReactNode } from 'react';

/**
 * The room bet-panel header frame: a three-layer pixel-pitch backdrop (radial base, team-colour
 * beams, central scrim), a scaled figure layer, and a centred title slot. Shared by the live
 * {@link RoomHeroArt} and the `/sandbox/room-hero` editor so both render an identical card.
 *
 * `figures` sits in the scaled layer (behind the title); `children` is the centred title block and
 * never intercepts pointer events, keeping the figures draggable in the editor.
 */
export function RoomHeroFrame({
  homeColor,
  awayColor,
  figures,
  children,
}: {
  homeColor: string;
  awayColor: string;
  figures: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative h-[150px] shrink-0 overflow-hidden">
      {/* Three-layer hero backdrop (mirrors HeroCardShell): pitch base, team beams, scrim. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_120%,#12160f_0%,#0a0c0a_60%,#070807_100%)]" />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-3/5 opacity-70 mix-blend-screen"
        style={{ background: `linear-gradient(108deg, ${homeColor} 0%, transparent 68%)` }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-3/5 opacity-70 mix-blend-screen"
        style={{ background: `linear-gradient(252deg, ${awayColor} 0%, transparent 68%)` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(50%_85%_at_50%_50%,rgba(4,6,4,0.55)_0%,transparent_70%)]"
      />

      {/* Figures were tuned for the 190px card; scale down slightly for the 150px header. */}
      <div className="absolute inset-0 origin-bottom scale-90">{figures}</div>

      {/* Centred title block — never intercepts pointer events. */}
      <div className="pointer-events-none relative flex h-full flex-col items-center justify-center gap-1.5 text-center">
        {children}
      </div>
    </div>
  );
}
