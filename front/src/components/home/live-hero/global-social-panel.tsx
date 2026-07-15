'use client';

import { useState } from 'react';

import { CaretDown, ChartBar, ChatCircle, List, Users, type Icon } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { LiveMatchCard } from '@/components/home/dashboard/live-match-card';
import { TeamStatisticCard } from '@/components/home/dashboard/team-statistic-card';
import { PerformanceChart } from '@/components/home/dashboard/performance-chart';
import { CrowdMessage } from '@/components/crowd/crowd-message';
import { CrowdComposer } from '@/components/crowd/crowd-composer';
import { useCrowdMessages } from '@/store/crowd.store';
import { useDisplayEvents, useMatchEvents } from '@/store/match.store';
import { useViewerCount } from '@/store/viewers.store';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';
import { formatCompact } from '@/lib/format';
import { cn } from '@/lib/utils';

// The global counterpart of RoomSocialPanel: same glass shell + tabs, but the "Chat" tab is the
// PUBLIC live crowd (open stands + HatBot), not a private room's members-only thread.
type SocialTab = 'stats' | 'events' | 'crowd';

const TABS: { id: SocialTab; label: string; icon: Icon }[] = [
  { id: 'stats', label: 'Stats', icon: ChartBar },
  { id: 'events', label: 'Events', icon: List },
  { id: 'crowd', label: 'Crowd', icon: ChatCircle },
];

function eventTitle(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Embedded public crowd feed — reuses the crowd-panel body without its own glass shell/header. */
function GlobalCrowdFeed() {
  const messages = useCrowdMessages();
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        data-lenis-prevent
        className="custom-scrollbar flex min-h-0 flex-1 flex-col-reverse gap-4 overflow-y-auto overflow-x-hidden p-4"
      >
        {[...messages].reverse().map((message) => (
          <CrowdMessage key={message.id} message={message} />
        ))}
      </div>
      <div className="border-t border-border bg-surface-1/70">
        <CrowdComposer fixtureId={MOCK_FIXTURE_ID} />
      </div>
    </div>
  );
}

function GlobalEventsFeed() {
  const liveEvents = useMatchEvents();
  const displayEvents = useDisplayEvents();
  const events = (liveEvents.length ? liveEvents : displayEvents).slice(-30).reverse();

  return (
    <div data-lenis-prevent className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden p-3">
      {events.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/80 px-3 py-6 text-center text-xs font-medium text-muted-foreground">
          No match events yet.
        </div>
      ) : (
        events.map((event, index) => {
          const action = String(event.rawAction ?? event.action);
          const details = [event.label, event.outcome, event.participant ? `Team ${event.participant}` : null].filter(Boolean);
          return (
            <div
              key={`${event.fixtureId}-${event.seq}-${index}`}
              className="rounded-md border border-border/70 bg-surface-1/65 px-3 py-2"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 min-w-9 rounded bg-white/[0.06] px-1.5 py-0.5 text-center text-[11px] font-black text-neon">
                  {event.minute != null ? `${event.minute}'` : '--'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-foreground">{eventTitle(action)}</p>
                  {details.length > 0 ? (
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-muted-foreground">{details.join(' · ')}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/**
 * The home hero's social widget: live match stats and the open live crowd behind
 * two tabs, sharing one glass surface with the global viewer count in the header.
 * Mirrors RoomSocialPanel's chrome so the landing hero reads exactly like a room —
 * minus anything private (no members, no room chat).
 */
export function GlobalSocialPanel({ className }: { className?: string }) {
  const [tab, setTab] = useState<SocialTab>('stats');
  const [open, setOpen] = useState(true);
  const viewers = useViewerCount();

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
          <Users className="size-3.5" /> {formatCompact(viewers)}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? 'Hide crowd panel' : 'Show crowd panel'}
            className="ml-1 grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
          >
            <CaretDown className={cn('size-4 transition-transform duration-300', !open && '-rotate-90')} />
          </button>
        </span>
      </div>

      {!open ? null : tab === 'crowd' ? (
        <GlobalCrowdFeed />
      ) : tab === 'events' ? (
        <GlobalEventsFeed />
      ) : (
        <div data-lenis-prevent className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-3">
          <LiveMatchCard />
          <TeamStatisticCard />
          <PerformanceChart />
        </div>
      )}
    </GlassPanel>
  );
}
