'use client';

import { useState } from 'react';
import { useDuelists } from '@/services/queries/use-duelists';
import { useFriendsStore } from '@/store/friends.store';
import { tierFilters } from '@/config/duelists.config';
import { RankTier } from '@/enums/rank-tier.enum';
import { WireBlock } from '@/components/common/wire-block';
import { cn } from '@/lib/utils';
import { DuelistTile } from './duelist-tile';
import type { PlayerProfile } from '@/config/duelists.config';

type FriendFilter = 'all' | 'friends';

const FRIEND_TABS: { value: FriendFilter; label: string }[] = [
  { value: 'all', label: 'All players' },
  { value: 'friends', label: 'Friends' },
];

/** Interactive duelists grid — client boundary: handles filter state + React Query data. */
export function DuelistsDirectory() {
  const [tierFilter, setTierFilter] = useState<RankTier | 'all'>('all');
  const [friendFilter, setFriendFilter] = useState<FriendFilter>('all');

  const { data: profiles, isLoading, isError } = useDuelists();
  const friendIds = useFriendsStore((s) => s.friendIds);

  const filtered = (profiles ?? []).filter((p: PlayerProfile) => {
    const tierMatch = tierFilter === 'all' || p.tier === tierFilter;
    const friendMatch = friendFilter === 'all' || friendIds.includes(p.id);
    return tierMatch && friendMatch;
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Duelists</h1>

      {/* Filter controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tier chips */}
        <div className="flex flex-wrap gap-2">
          {tierFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTierFilter(filter.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
                tierFilter === filter.value
                  ? 'border-neon bg-neon text-black'
                  : 'border-border bg-surface-2/60 text-muted-foreground hover:border-border/80 hover:text-foreground',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Friends / All toggle */}
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface-2/60 p-1">
          {FRIEND_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFriendFilter(tab.value)}
              className={cn(
                'rounded-full px-3 py-0.5 text-[11px] font-semibold transition-colors',
                friendFilter === tab.value
                  ? 'bg-neon text-black'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <WireBlock key={i} label="Loading…" className="h-72" />
          ))}
        </div>
      ) : null}

      {/* Error state */}
      {isError ? (
        <WireBlock label="Failed to load duelists. Please try again." className="h-32" />
      ) : null}

      {/* Empty state */}
      {!isLoading && !isError && filtered.length === 0 ? (
        <WireBlock label="No duelists match the current filters." className="h-32" />
      ) : null}

      {/* Grid */}
      {!isLoading && !isError && filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((profile: PlayerProfile) => (
            <DuelistTile key={profile.id} profile={profile} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
