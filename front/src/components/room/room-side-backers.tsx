'use client';

import { useMemo } from 'react';

import { UserAvatar } from '@/components/common/user-avatar';
import { backersFor, useRoomPicks } from '@/store/room-picks.store';
import { cn } from '@/lib/utils';

const MAX_VISIBLE = 4;

/**
 * Stacked photos of everyone backing a side, flanking the scoreboard — home
 * bettors by the home column, away bettors mirrored on the other side, each
 * stack growing toward the score.
 */
export function RoomSideBackers({ side }: { side: 'home' | 'away' }) {
  const picks = useRoomPicks();
  const backers = useMemo(() => backersFor(picks, side), [picks, side]);

  if (backers.length === 0) return <span className="hidden w-[4.5rem] sm:block" aria-hidden />;

  const shown = backers.slice(0, MAX_VISIBLE);
  const extra = backers.length - shown.length;
  const home = side === 'home';

  return (
    <div
      className={cn('hidden w-[4.5rem] items-center sm:flex', home ? 'justify-end' : 'justify-start')}
      aria-label={`${backers.length} backing the ${side} side`}
    >
      {home && extra > 0 && (
        <span className="z-0 -mr-2 grid size-6 shrink-0 place-items-center rounded-full bg-overlay/60 text-micro font-bold text-foreground ring-2 ring-background/60 backdrop-blur-md">
          +{extra}
        </span>
      )}
      {shown.map((pick, index) => (
        <UserAvatar
          key={pick.userId}
          src={pick.avatarSrc}
          alt={pick.name}
          size={26}
          className={cn(
            'rounded-full ring-2 ring-background/70 animate-in fade-in zoom-in-75 duration-300',
            index > 0 && '-ml-2',
          )}
        />
      ))}
      {!home && extra > 0 && (
        <span className="-ml-2 grid size-6 shrink-0 place-items-center rounded-full bg-overlay/60 text-micro font-bold text-foreground ring-2 ring-background/60 backdrop-blur-md">
          +{extra}
        </span>
      )}
    </div>
  );
}
