'use client';

import { Scoreboard } from '@/components/live/scoreboard';
import { MatchTimeline } from '@/components/live/match-timeline';
import { RoomBetSlip } from './room-bet-slip';
import { RoomResultDock } from './room-result-dock';
import { RoomBetPanel } from './room-bet-panel';
import { RoomInvitePanel } from './room-invite-panel';
import { RoomSocialPanel } from './room-social-panel';
import { RoomSideBackers } from './room-side-backers';
import { RoomPickToast } from './room-pick-toast';
import { RoomMiniPitch } from './room-mini-pitch';
import { RoomMobileActions } from './room-mobile-actions';
import { ImpactSlide } from './impact-slide';
import { useIsRoomHost } from './use-room-host';

export interface RoomLayoutProps {
  roomId: string;
  inviteToken: string | null;
  inviteUrl: string;
}

/**
 * Immersive room: widgets pinned near the screen edges over the full-bleed live
 * stage (mirrors the home hero). On cinematic beats (goal/replay/red card) only
 * the BET surfaces slide off-screen (ImpactSlide) — everything else stays up.
 * Rails have NO overflow of their own — panels scroll internally, so their glass
 * shadows never get clipped.
 */
export function RoomImmersiveLayout({ roomId, inviteToken, inviteUrl }: RoomLayoutProps) {
  const isHost = useIsRoomHost();

  return (
    <div className="relative h-full w-full">
      {/* Scoreboard flanked by each side's backers — top-centre under the navbar. */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+4.25rem)] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 md:top-16">
        <Scoreboard
          canSwitchMatch={isHost}
          homeBackers={<RoomSideBackers side="home" />}
          awayBackers={<RoomSideBackers side="away" />}
        />
        <RoomPickToast />
      </div>

      {/* Bet widget — desktop left rail; slides down and away during a goal beat.
          Gated at xl: below ~1280px the 560px centre dock would overlap the edge rails
          (and the scoreboard), so md–xl falls back to the pill layout (RoomMobileActions). */}
      <ImpactSlide
        direction="down"
        className="hidden xl:absolute xl:top-20 xl:bottom-24 xl:left-6 xl:flex xl:min-h-0 xl:w-[330px] xl:flex-col xl:gap-3"
      >
        <RoomBetPanel className="min-h-0 flex-1" />
        <RoomBetSlip />
      </ImpactSlide>

      {/* Invite + social — desktop right rail (stays visible on beats). */}
      <div className="hidden xl:absolute xl:top-20 xl:right-6 xl:bottom-24 xl:flex xl:min-h-0 xl:w-[340px] xl:flex-col xl:gap-3">
        <RoomInvitePanel inviteToken={inviteToken} inviteUrl={inviteUrl} />
        <RoomSocialPanel roomId={roomId} className="flex-1" />
      </div>

      {/* Mini watcher — right of the bet rail, above the timeline (xl+ only, where the rails exist). */}
      <ImpactSlide direction="down" className="absolute bottom-24 left-[370px] z-10 hidden xl:block">
        <RoomMiniPitch />
      </ImpactSlide>

      {/* The headline bet (Match Result, metal 1·X·2) — a bet surface, slides down on beats. */}
      <ImpactSlide
        direction="down"
        className="absolute inset-x-3 bottom-[7.5rem] z-20 flex justify-center sm:inset-x-4 xl:inset-x-auto xl:bottom-24 xl:left-1/2 xl:-translate-x-1/2"
      >
        <RoomResultDock />
      </ImpactSlide>

      {/* Mobile pills + the timeline readout (no replay/pace controls in a shared room). */}
      <RoomMobileActions roomId={roomId} inviteToken={inviteToken} inviteUrl={inviteUrl} />
      <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3 md:px-6 md:pb-4">
        <MatchTimeline playback={false} />
      </div>
    </div>
  );
}
