'use client';

import { useState } from 'react';

import { CaretDown, ChatCircle, Lock, Ticket, UserPlus, Users, type Icon } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MarketsPanel } from '@/components/live/markets-panel';
import { BetSlip } from '@/components/live/bet-slip';
import { RoomChatPanel } from './room-chat-panel';
import { RoomInvitePanel } from './room-invite-panel';
import { useRoomMembers, useRoomPresence } from '@/store/room.store';
import { cn } from '@/lib/utils';

type RoomTab = 'chat' | 'bet' | 'invite';

const TABS: { id: RoomTab; label: string; icon: Icon }[] = [
  { id: 'chat', label: 'Chat', icon: ChatCircle },
  { id: 'bet', label: 'Bet', icon: Ticket },
  { id: 'invite', label: 'Invite', icon: UserPlus },
];

interface RoomDockProps {
  roomId: string;
  roomName: string;
  inviteToken: string | null;
  inviteUrl: string;
}

/** Odds board + slip, scrollable — the Bet tab body. */
function BetTab() {
  return (
    <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      <MarketsPanel />
      <BetSlip />
    </div>
  );
}

function TabBody({ tab, roomId, inviteToken, inviteUrl }: { tab: RoomTab } & Omit<RoomDockProps, 'roomName'>) {
  if (tab === 'chat') return <RoomChatPanel roomId={roomId} embedded />;
  if (tab === 'bet') return <BetTab />;
  return <RoomInvitePanel embedded inviteToken={inviteToken} inviteUrl={inviteUrl} />;
}

/**
 * The single floating room widget over the live game: a right-side dock (desktop)
 * with Chat · Bet · Invite tabs and a collapse toggle, and a bottom button bar
 * that opens each tab in a dialog on mobile (keeps the pitch uncluttered).
 */
export function RoomDock({ roomId, roomName, inviteToken, inviteUrl }: RoomDockProps) {
  const members = useRoomMembers();
  const presence = useRoomPresence();
  const count = Math.max(presence, members.length);
  const [tab, setTab] = useState<RoomTab>('chat');
  const [open, setOpen] = useState(true);

  const tabBar = (
    <div className="flex gap-1 border-t border-border bg-surface-1/40 p-1">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition',
            tab === t.id ? 'bg-neon/15 text-neon' : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
          )}
        >
          <t.icon className="size-3.5" />
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop — floating right rail. */}
      <GlassPanel
        tone="surface"
        className={cn(
          'z-20 hidden overflow-hidden md:absolute md:right-6 md:top-20 md:flex md:w-[360px] md:flex-col',
          open && 'md:bottom-24',
        )}
      >
        <div className="flex items-center gap-2 border-b border-border bg-surface-1/60 px-3 py-2">
          <Lock className="size-4 shrink-0 text-neon" weight="duotone" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{roomName}</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Users className="size-3.5" /> {count}
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Collapse room panel' : 'Expand room panel'}
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
          >
            <CaretDown className={cn('size-4 transition-transform duration-300', !open && '-rotate-90')} />
          </button>
        </div>
        {open && (
          <>
            {tabBar}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <TabBody tab={tab} roomId={roomId} inviteToken={inviteToken} inviteUrl={inviteUrl} />
            </div>
          </>
        )}
      </GlassPanel>

      {/* Mobile — bottom button bar; each opens its tab in a dialog. */}
      <div className="absolute inset-x-3 bottom-20 z-20 flex items-center justify-center gap-2 md:hidden">
        {TABS.map((t) => (
          <Dialog key={t.id}>
            <DialogTrigger className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-overlay/60 px-3 py-2 text-xs font-semibold text-white/85 backdrop-blur-md transition hover:bg-overlay/75">
              <t.icon className="size-4" />
              {t.label}
            </DialogTrigger>
            <DialogContent className="overflow-hidden p-0">
              <DialogTitle className="sr-only">{t.label}</DialogTitle>
              <div className="flex h-[70svh] min-h-0 flex-col">
                <TabBody tab={t.id} roomId={roomId} inviteToken={inviteToken} inviteUrl={inviteUrl} />
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </>
  );
}
