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
      <ImpactSlide direction="up" className="absolute top-[calc(env(safe-area-inset-top)+4.25rem)] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 md:top-16">
        <Scoreboard homeBackers={<HeroCardsBadge side="home" />} awayBackers={<HeroCardsBadge side="away" />} />
        <RoomPickToast />
      </ImpactSlide>

      {/* Bet widget — desktop left rail; slides down and away during a goal beat.
          Gated at xl: below ~1280px the 560px centre dock would overlap the edge rails,
          so md–xl falls back to the pill layout (GlobalMobileActions) instead. */}
      <ImpactSlide
        direction="down"
        className="hidden xl:absolute xl:top-20 xl:bottom-24 xl:left-6 xl:flex xl:min-h-0 xl:w-[330px] xl:flex-col xl:gap-3"
      >
        <RoomBetPanel className="min-h-0 flex-1" />
        <RoomBetSlip />
      </ImpactSlide>

      {/* Stats + live crowd — desktop right rail (stays visible on beats). */}
      <div className="hidden xl:absolute xl:top-20 xl:right-6 xl:bottom-24 xl:flex xl:min-h-0 xl:w-[340px] xl:flex-col xl:gap-3">
        <GlobalSocialPanel className="flex-1" />
      </div>

      {/* Mini watcher — right of the bet rail, above the timeline (xl+ only, where the rails exist). */}
      <ImpactSlide direction="down" className="absolute bottom-24 left-[370px] z-10 hidden xl:block">
        <RoomMiniPitch />
      </ImpactSlide>

      {/* The headline bet (Match Result, metal 1·X·2) with the data-provider credit sat right above it —
          both slide down together on beats. */}
      <ImpactSlide
        direction="down"
        className="absolute inset-x-3 bottom-[7.5rem] z-20 flex flex-col items-center gap-2 sm:inset-x-4 xl:inset-x-auto xl:bottom-24 xl:left-1/2 xl:-translate-x-1/2"
      >
        <span className="inline-flex items-center rounded-full border border-white/15 bg-overlay/55 px-3 py-1.5 backdrop-blur-md">
          <PoweredByTxline tone="hero" className="pointer-events-auto" />
        </span>
        <RoomResultDock />
      </ImpactSlide>

      {/* Mobile pills + the timeline readout (no replay/pace controls in a shared live view). */}
      <ImpactSlide direction="down" className="xl:hidden">
        <GlobalMobileActions />
      </ImpactSlide>
      <ImpactSlide direction="down" className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3 md:px-6 md:pb-4">
        <MatchTimeline playback={false} />
      </ImpactSlide>
    </div>
  );
}
