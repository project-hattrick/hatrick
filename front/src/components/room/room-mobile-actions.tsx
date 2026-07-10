'use client';

import { type ReactNode } from 'react';

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChatCircle, Ticket, UserPlus, type Icon } from '@/components/common/icons';
import { MarketsPanel } from '@/components/live/markets-panel';
import { BetSlip } from '@/components/live/bet-slip';
import { RoomChatPanel } from './room-chat-panel';
import { RoomInvitePanel } from './room-invite-panel';

/** One glass pill that opens its room widget in a modal (panels keep their own header). */
function Action({ icon: IconGlyph, label, children }: { icon: Icon; label: string; children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label={label}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-overlay/60 px-3 py-2 text-xs font-semibold text-white/85 backdrop-blur-md transition hover:bg-overlay/75"
      >
        <IconGlyph className="size-4" />
        {label}
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}

interface RoomMobileActionsProps {
  roomId: string;
  inviteToken: string | null;
  inviteUrl: string;
}

/** Mobile-only: the room widgets as pills that open each panel in a modal. */
export function RoomMobileActions({ roomId, inviteToken, inviteUrl }: RoomMobileActionsProps) {
  return (
    <div className="absolute inset-x-3 bottom-20 z-20 flex items-center justify-center gap-2 md:hidden">
      <Action icon={ChatCircle} label="Chat">
        <div className="flex h-[70svh] min-h-0 flex-col">
          <RoomChatPanel roomId={roomId} />
        </div>
      </Action>
      <Action icon={Ticket} label="Bet">
        <div className="custom-scrollbar flex max-h-[70svh] flex-col gap-3 overflow-y-auto p-3">
          <MarketsPanel />
          <BetSlip />
        </div>
      </Action>
      <Action icon={UserPlus} label="Invite">
        <div className="flex h-[70svh] min-h-0 flex-col">
          <RoomInvitePanel inviteToken={inviteToken} inviteUrl={inviteUrl} />
        </div>
      </Action>
    </div>
  );
}
