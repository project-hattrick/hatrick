'use client';

import { HeroFigure } from '@/components/home/dashboard/match-hero-card';
import { RoomHeroFrame } from '@/components/room/room-hero-frame';
import { roomHeroTeamFor } from '@/config/room-hero.config';
import { teamColor } from '@/config/team-colors.config';
import { fifaToIso } from '@/lib/country';
import { useDisplayMatch, useIsMatchLive, useIsReplay } from '@/store/match.store';
import { useKickoffCountdown } from '@/hooks/use-kickoff-countdown';
import { useLiveMinute } from '@/hooks/use-live-minute';

/**
 * The bet panel's header art — the home hero-card treatment (radial base, team colour beams,
 * pixel-art figures) bound to the CURRENT live match. Figure positions come from the room-only
 * placements (`roomHeroTeamFor`), so tuning them in `/sandbox/room-hero` never shifts the landing
 * hero card. Renders as a block inside the panel, not as its own GlassPanel.
 */
export function RoomHeroArt() {
  const match = useDisplayMatch();
  const isLive = useIsMatchLive();
  const isReplay = useIsReplay();
  const countdown = useKickoffCountdown();
  const liveMinute = useLiveMinute();

  const homeColor = teamColor(fifaToIso(match.home.code));
  const awayColor = teamColor(fifaToIso(match.away.code));
  const homeFigure = roomHeroTeamFor(match.home.name, match.home.code, 'home');
  const awayFigure = roomHeroTeamFor(match.away.name, match.away.code, 'away');

  return (
    <RoomHeroFrame
      homeColor={homeColor}
      awayColor={awayColor}
      figures={
        <>
          <HeroFigure team={homeFigure} side="home" placement={homeFigure.placement} />
          <HeroFigure team={awayFigure} side="away" placement={awayFigure.placement} />
        </>
      }
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 font-mono text-micro font-bold tracking-wider text-white/85 uppercase ring-1 ring-white/10 backdrop-blur-md">
        {countdown ? (
          <span className="size-1.5 animate-pulse rounded-full bg-neon" />
        ) : isReplay ? (
          <span className="size-1.5 rounded-full bg-neon" />
        ) : (
          isLive && <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
        )}
        {countdown
          ? 'Starting soon'
          : isReplay
            ? `Replay · ${liveMinute}'`
            : isLive
              ? `Live · ${liveMinute}'`
              : 'Full-time'}
      </span>
      <span className="text-[15px] font-bold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        {match.home.name} <span className="text-white/45">vs</span> {match.away.name}
      </span>
      {/* Pre-kickoff the scoreline slot shows the ticking countdown instead of 0–0. */}
      <span className="font-mono text-xl font-bold tabular-nums text-neon drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        {countdown ?? `${match.score.home}–${match.score.away}`}
      </span>
    </RoomHeroFrame>
  );
}
