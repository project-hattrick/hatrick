'use client';

import { Scoreboard } from '@/components/live/scoreboard';
import { MatchTimeline } from '@/components/live/match-timeline';
import { PoweredByTxline } from '@/components/common/powered-by-txline';
import { RoomBetSlip } from '@/components/room/room-bet-slip';
import { RoomResultDock } from '@/components/room/room-result-dock';
import { RoomBetPanel } from '@/components/room/room-bet-panel';
import { RoomPickToast } from '@/components/room/room-pick-toast';
import { RoomMiniPitch } from '@/components/room/room-mini-pitch';
import { ImpactSlide } from '@/components/room/impact-slide';
import { HeroCardsBadge } from './hero-cards-badge';
import { GlobalSocialPanel } from './global-social-panel';
import { GlobalMobileActions } from './global-mobile-actions';

/**
 * Immersive global live view: the room's watch-party layout, made public. Widgets
 * pinned near the screen edges over the full-bleed live stage — bet rail left,
 * stats + live crowd right, headline 1·X·2 dock centred. On cinematic beats
 * (goal / replay / red card) only the BET surfaces slide away (ImpactSlide).
 * No invites: the backers + crowd are the GLOBAL public book, not a private room.
 */
export function GlobalLiveImmersive() {
  return (
    <div className="relative h-full w-full">
      {/* Scoreboard flanked by each side's booking cards (yellow/red) — top-centre under the navbar. */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+4.25rem)] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 md:top-16">
        <Scoreboard homeBackers={<HeroCardsBadge side="home" />} awayBackers={<HeroCardsBadge side="away" />} />
        <RoomPickToast />
      </div>

      {/* Bet widget — desktop left rail; slides down and away during a goal beat. */}
      <ImpactSlide
        direction="down"
        className="hidden md:absolute md:top-20 md:bottom-24 md:left-6 md:flex md:min-h-0 md:w-[330px] md:flex-col md:gap-3"
      >
        <RoomBetPanel className="min-h-0 flex-1" />
        <RoomBetSlip />
      </ImpactSlide>

      {/* Stats + live crowd — desktop right rail (stays visible on beats). */}
      <div className="hidden md:absolute md:top-20 md:right-6 md:bottom-24 md:flex md:min-h-0 md:w-[340px] md:flex-col md:gap-3">
        <GlobalSocialPanel className="flex-1" />
      </div>

      {/* Mini watcher — right of the bet rail, above the timeline (lg+ only). */}
      <ImpactSlide direction="down" className="absolute bottom-24 left-[370px] z-10 hidden lg:block">
        <RoomMiniPitch />
      </ImpactSlide>

      {/* The headline bet (Match Result, metal 1·X·2) with the data-provider credit sat right above it —
          both slide down together on beats. */}
      <ImpactSlide
        direction="down"
        className="absolute inset-x-3 bottom-[7.5rem] z-20 flex flex-col items-center gap-2 sm:inset-x-4 md:inset-x-auto md:bottom-24 md:left-1/2 md:-translate-x-1/2"
      >
        <span className="inline-flex items-center rounded-full border border-white/15 bg-overlay/55 px-3 py-1.5 backdrop-blur-md">
          <PoweredByTxline tone="hero" className="pointer-events-auto" />
        </span>
        <RoomResultDock />
      </ImpactSlide>

      {/* Mobile pills + the timeline readout (no replay/pace controls in a shared live view). */}
      <GlobalMobileActions />
      <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3 md:px-6 md:pb-4">
        <MatchTimeline playback={false} />
      </div>
    </div>
  );
}
