'use client';

import { useState } from 'react';
import { useDuelists } from '@/services/queries/use-duelists';
import { useAuth } from '@/services/queries/use-auth';
import { useFriendsStore } from '@/store/friends.store';
import { tierFilters } from '@/config/duelists.config';
import { RankTier } from '@/enums/rank-tier.enum';
import { WireBlock } from '@/components/common/wire-block';
import { cn } from '@/lib/utils';
import { DuelistTile } from './duelist-tile';
import type { PlayerProfile } from '@/config/duelists.config';
import { useT } from '@/i18n/i18n-provider';

type FriendFilter = 'all' | 'friends';

const FRIEND_TABS: { value: FriendFilter; labelKey: 'pages.duelists.allPlayers' | 'pages.duelists.friends' }[] = [
  { value: 'all', labelKey: 'pages.duelists.allPlayers' },
  { value: 'friends', labelKey: 'pages.duelists.friends' },
];

/** Interactive duelists grid: handles filter state and React Query data. */
export function DuelistsDirectory() {
  const t = useT();
  const [tierFilter, setTierFilter] = useState<RankTier | 'all'>('all');
  const [friendFilter, setFriendFilter] = useState<FriendFilter>('all');

  const { data: profiles, isLoading, isError } = useDuelists();
  const { user } = useAuth();
  const friendIds = useFriendsStore((s) => s.friendIds);

  const roster = (profiles ?? []).filter((profile: PlayerProfile) => !user || profile.id !== user.id);

  const filtered = roster.filter((profile: PlayerProfile) => {
    const tierMatch = tierFilter === 'all' || profile.tier === tierFilter;
    const friendMatch = friendFilter === 'all' || friendIds.includes(profile.id);
    return tierMatch && friendMatch;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-20 z-20 -mx-2 flex flex-col gap-3 rounded-2xl bg-background/85 px-2 py-2 shadow-e2 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {tierFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTierFilter(filter.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-caption font-semibold transition-colors',
                tierFilter === filter.value
                  ? 'border-neon bg-neon text-black'
                  : 'border-border bg-surface-2/60 text-muted-foreground hover:border-border/80 hover:text-foreground',
              )}
            >
              {t(`pages.duelists.tiers.${filter.value}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-border bg-surface-2/60 p-1">
          {FRIEND_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFriendFilter(tab.value)}
              className={cn(
                'rounded-full px-3 py-0.5 text-caption font-semibold transition-colors',
                friendFilter === tab.value ? 'bg-neon text-black' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <WireBlock key={index} label={t('pages.duelists.loading')} className="h-72" />
          ))}
        </div>
      ) : null}

      {isError ? <WireBlock label={t('pages.duelists.loadError')} className="h-32" /> : null}

      {!isLoading && !isError && filtered.length === 0 ? (
        <WireBlock label={t('pages.duelists.empty')} className="h-32" />
      ) : null}

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
