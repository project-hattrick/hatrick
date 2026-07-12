'use client';

import { useMatchStats } from '@/store/match.store';
import { cn } from '@/lib/utils';

/** A single booking-card chip — a small colored rectangle with its running count. */
function CardChip({ count, tone }: { count: number; tone: 'yellow' | 'red' }) {
  return (
    <span className="flex items-center gap-1">
      <span
        aria-hidden
        className={cn(
          'block h-4 w-3 rounded-[2px] ring-1 ring-black/40 shadow-[0_1px_4px_rgba(0,0,0,0.6)]',
          tone === 'yellow' ? 'bg-yellow-400' : 'bg-red-600',
        )}
      />
      <span className="font-mono text-xs font-bold tabular-nums text-foreground [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
        {count}
      </span>
    </span>
  );
}

/**
 * Booking cards for one side, flanking the scoreboard where the bettor photos used to be — yellow
 * and red counts straight from the feed-tallied match stats. A side with no cards renders an invisible
 * spacer so the scoreboard stays centred (matches the old backers footprint).
 */
export function HeroCardsBadge({ side }: { side: 'home' | 'away' }) {
  const stats = useMatchStats();
  const yellow = stats.yellowCards[side];
  const red = stats.redCards[side];

  if (yellow === 0 && red === 0) return <span className="hidden w-[4.5rem] sm:block" aria-hidden />;

  const home = side === 'home';
  return (
    <div
      className={cn('hidden w-[4.5rem] items-center gap-2 sm:flex', home ? 'justify-end' : 'justify-start')}
      aria-label={`${side} side: ${yellow} yellow, ${red} red`}
    >
      {yellow > 0 && <CardChip count={yellow} tone="yellow" />}
      {red > 0 && <CardChip count={red} tone="red" />}
    </div>
  );
}
