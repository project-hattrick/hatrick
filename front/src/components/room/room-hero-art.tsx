'use client';

import { HeroFigure } from '@/components/home/dashboard/match-hero-card';
import { heroTeamFor } from '@/config/match-dashboard.config';
import { teamColor } from '@/config/team-colors.config';
import { fifaToIso } from '@/lib/country';
import { useDisplayMatch, useIsMatchLive } from '@/store/match.store';
import { useKickoffCountdown } from '@/hooks/use-kickoff-countdown';
import { useLiveMinute } from '@/hooks/use-live-minute';
import type { HeroFigurePlacement } from '@/config/match-dashboard.config';

const FIGURE_OUTSET = 24;

function roomFigurePlacement(side: 'home' | 'away', placement: HeroFigurePlacement): HeroFigurePlacement {
  return {
    ...placement,
    x: side === 'home' ? placement.x - FIGURE_OUTSET : placement.x + FIGURE_OUTSET,
  };
}

/**
 * The bet panel's header art — the home hero-card treatment (radial base, team
 * colour beams, pixel-art figures) bound to the CURRENT live match. Renders as a
 * block inside the panel, not as its own GlassPanel.
 */
export function RoomHeroArt() {
  const match = useDisplayMatch();
  const isLive = useIsMatchLive();
  const countdown = useKickoffCountdown();
  const liveMinute = useLiveMinute();

  const homeColor = teamColor(fifaToIso(match.home.code));
  const awayColor = teamColor(fifaToIso(match.away.code));
  const homeFigure = heroTeamFor(match.home.name, match.home.code, 'home');
  const awayFigure = heroTeamFor(match.away.name, match.away.code, 'away');
  const homePlacement = roomFigurePlacement('home', homeFigure.placement);
  const awayPlacement = roomFigurePlacement('away', awayFigure.placement);

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
      <div className="absolute inset-0 origin-bottom scale-90">
        <HeroFigure team={homeFigure} side="home" placement={homePlacement} />
        <HeroFigure team={awayFigure} side="away" placement={awayPlacement} />
      </div>

      {/* Centred title block. */}
      <div className="pointer-events-none relative flex h-full flex-col items-center justify-center gap-1.5 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 font-mono text-micro font-bold tracking-wider text-white/85 uppercase ring-1 ring-white/10 backdrop-blur-md">
          {countdown ? (
            <span className="size-1.5 animate-pulse rounded-full bg-neon" />
          ) : (
            isLive && <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
          )}
          {countdown ? 'Starting soon' : isLive ? `Live · ${liveMinute}'` : 'Full-time'}
        </span>
        <span className="text-[15px] font-bold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {match.home.name} <span className="text-white/45">vs</span> {match.away.name}
        </span>
        {/* Pre-kickoff the scoreline slot shows the ticking countdown instead of 0–0. */}
        <span className="font-mono text-xl font-bold tabular-nums text-neon drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {countdown ?? `${match.score.home}–${match.score.away}`}
        </span>
      </div>
    </div>
  );
}
