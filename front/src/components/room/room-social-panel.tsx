'use client';

import { useState } from 'react';

import { CaretDown, ChartBar, ChatCircle, Users, type Icon } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { LiveMatchCard } from '@/components/home/dashboard/live-match-card';
import { TeamStatisticCard } from '@/components/home/dashboard/team-statistic-card';
import { PerformanceChart } from '@/components/home/dashboard/performance-chart';
import { useRoomMembers, useRoomPresence } from '@/store/room.store';
import { cn } from '@/lib/utils';
import { RoomChatPanel } from './room-chat-panel';

// HatBot no longer has its own tab — its commentary + betting nudges are fused into the Chat feed
// (see RoomChatPanel), so the friends' messages and the bot's calls share one timeline.
type SocialTab = 'chat' | 'stats';

const TABS: { id: SocialTab; label: string; icon: Icon }[] = [
  { id: 'stats', label: 'Stats', icon: ChartBar },
  { id: 'chat', label: 'Chat', icon: ChatCircle },
];

/**
 * The room's social widget: chat and live match stats behind two tabs, sharing
 * one glass surface with the presence count in the header.
 */
export function RoomSocialPanel({ roomId, className }: { roomId: string; className?: string }) {
  const [tab, setTab] = useState<SocialTab>('stats');
  const [open, setOpen] = useState(true);
  const members = useRoomMembers();
  const presence = useRoomPresence();

  return (
    <GlassPanel tone="surface" className={cn('flex min-h-0 flex-col overflow-hidden', open ? className : 'mt-auto')}>
      <div className="flex items-center border-b border-border bg-surface-1/60 px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs font-medium transition',
              tab === t.id
                ? 'border-neon text-neon'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1.5 pr-2 text-xs font-semibold text-muted-foreground">
          <Users className="size-3.5" /> {Math.max(presence, members.length)}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? 'Hide room panel' : 'Show room panel'}
            className="ml-1 grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
          >
            <CaretDown className={cn('size-4 transition-transform duration-300', !open && '-rotate-90')} />
          </button>
        </span>
      </div>

      {!open ? null : tab === 'chat' ? (
        <RoomChatPanel roomId={roomId} embedded />
      ) : (
        <div data-lenis-prevent className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <LiveMatchCard />
          <TeamStatisticCard />
          <PerformanceChart />
        </div>
      )}
    </GlassPanel>
  );
}
