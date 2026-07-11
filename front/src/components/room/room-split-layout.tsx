'use client';

import { Lock, UserPlus, Users } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Scoreboard } from '@/components/live/scoreboard';
import { MatchTimeline } from '@/components/live/match-timeline';
import { MatchBackground } from '@/components/live/match-background';
import { BetSlip } from '@/components/live/bet-slip';
import { RoomResultDock } from './room-result-dock';
import { useRoomMembers, useRoomPresence } from '@/store/room.store';
import { ImpactSlide } from './impact-slide';
import { RoomBetPanel } from './room-bet-panel';
import { RoomInvitePanel } from './room-invite-panel';
import { RoomSocialPanel } from './room-social-panel';
import { RoomSideBackers } from './room-side-backers';
import { RoomPickToast } from './room-pick-toast';
import { RoomMiniPitch } from './room-mini-pitch';
import { useIsRoomHost } from './use-room-host';
import type { RoomLayoutProps } from './room-immersive-layout';

/** Compact room header for the split rail: name + presence + the invite dialog. */
function RoomRailHeader({ roomName, inviteToken, inviteUrl }: { roomName: string } & Omit<RoomLayoutProps, 'roomId'>) {
  const members = useRoomMembers();
  const presence = useRoomPresence();

  return (
    <GlassPanel tone="dark" radius="lg" className="flex shrink-0 items-center gap-2 px-3 py-2">
      <Lock className="size-4 shrink-0 text-neon" weight="duotone" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{roomName}</span>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Users className="size-3.5" /> {Math.max(presence, members.length)}
      </span>
      <Dialog>
        <DialogTrigger className="flex cursor-pointer items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-2.5 py-1 text-xs font-semibold text-neon transition hover:bg-neon/20">
          <UserPlus className="size-3.5" />
          Invite
        </DialogTrigger>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Invite friends</DialogTitle>
          <div className="flex max-h-[70svh] min-h-0 flex-col">
            <RoomInvitePanel inviteToken={inviteToken} inviteUrl={inviteUrl} />
          </div>
        </DialogContent>
      </Dialog>
    </GlassPanel>
  );
}

/**
 * Split room: framed live match on the left (scoreboard, prediction dock, mini
 * watcher and timeline over the pitch), bet + social rail on the right — mirrors
 * the home split dashboard.
 */
export function RoomSplitLayout({ roomId, roomName, inviteToken, inviteUrl }: RoomLayoutProps & { roomName: string }) {
  const isHost = useIsRoomHost();

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 bg-background px-4 pt-20 md:flex-row md:overflow-hidden md:pt-[72px] md:pb-4">
      {/* Framed engine + overlays — on beats only the bet CTA slides away. */}
      <div className="relative min-h-[52vh] flex-1 overflow-hidden rounded-2xl border border-white/10 md:min-h-0">
        <MatchBackground scrim={false} />
        <div className="absolute top-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
          <Scoreboard
            canSwitchMatch={isHost}
            homeBackers={<RoomSideBackers side="home" />}
            awayBackers={<RoomSideBackers side="away" />}
          />
          <RoomPickToast />
        </div>
        <div className="absolute bottom-20 left-4 z-10 hidden lg:block">
          <RoomMiniPitch />
        </div>
        <ImpactSlide
          direction="down"
          className="absolute inset-x-4 bottom-20 z-20 flex justify-center md:inset-x-auto md:left-1/2 md:-translate-x-1/2"
        >
          <RoomResultDock />
        </ImpactSlide>
        <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3">
          {/* No replay/pace controls in a shared room — timeline is a readout only. */}
          <MatchTimeline playback={false} />
        </div>
      </div>

      {/* Room rail — invite strip, bet widget, slip and social tabs. The bet group
          slides off the right edge during a goal beat. */}
      <div className="flex w-full min-h-0 flex-col gap-3 md:w-[392px]">
        <RoomRailHeader roomName={roomName} inviteToken={inviteToken} inviteUrl={inviteUrl} />
        <ImpactSlide direction="right" className="flex min-h-0 flex-[1.3] flex-col gap-3">
          <RoomBetPanel className="min-h-0 flex-1" />
          <BetSlip />
        </ImpactSlide>
        <RoomSocialPanel roomId={roomId} className="min-h-0 flex-1" />
      </div>
    </div>
  );
}
