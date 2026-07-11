'use client';

import { Scoreboard } from '@/components/live/scoreboard';
import { MatchTimeline } from '@/components/live/match-timeline';
import { BetSlip } from '@/components/live/bet-slip';
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

      {/* Bet widget — desktop left rail; slides down and away during a goal beat. */}
      <ImpactSlide
        direction="down"
        className="hidden md:absolute md:top-20 md:bottom-24 md:left-6 md:flex md:min-h-0 md:w-[330px] md:flex-col md:gap-3"
      >
        <RoomBetPanel className="min-h-0 flex-1" />
        <BetSlip />
      </ImpactSlide>

      {/* Invite + social — desktop right rail (stays visible on beats). */}
      <div className="hidden md:absolute md:top-20 md:right-6 md:bottom-24 md:flex md:min-h-0 md:w-[340px] md:flex-col md:gap-3">
        <RoomInvitePanel inviteToken={inviteToken} inviteUrl={inviteUrl} />
        <RoomSocialPanel roomId={roomId} className="flex-1" />
      </div>

      {/* Mini watcher — right of the bet rail, above the timeline (lg+ only: at md it
          would collide with the rails flanking the narrow centre). */}
      <ImpactSlide direction="down" className="absolute bottom-24 left-[370px] z-10 hidden lg:block">
        <RoomMiniPitch />
      </ImpactSlide>

      {/* The headline bet (Match Result, metal 1·X·2) — a bet surface, slides down on beats. */}
      <ImpactSlide
        direction="down"
        className="absolute inset-x-3 bottom-[7.5rem] z-20 flex justify-center sm:inset-x-4 md:inset-x-auto md:bottom-24 md:left-1/2 md:-translate-x-1/2"
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
