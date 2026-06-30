import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { cn } from '@/lib/utils';
import { SectionLink } from './section-link';
import { formatThousands } from '@/lib/format';
import { topPlayers } from '@/config/home.config';

const rankAccent: Record<number, string> = {
  1: 'text-amber-300',
  2: 'text-zinc-300',
  3: 'text-orange-400',
};

/** Board column: global ranking leaderboard with the user's own row pinned. */
function TopPlayersCard() {
  return (
    <GlassPanel tone="surface" className="flex h-full flex-col">
      <SectionHeader title="Top players" action={<SectionLink href="/live" label="View ranking" />} />
      <div className="flex flex-1 flex-col px-2 pb-2">
        {topPlayers.map((player) => (
          <div
            key={player.rank}
            className={cn(
              'flex items-center justify-between rounded-lg px-2 py-2',
              player.you ? 'bg-neon/10 ring-1 ring-neon/40' : 'hover:bg-surface-3/40',
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className={cn('w-7 text-center text-sm font-bold', rankAccent[player.rank] ?? 'text-muted-foreground')}>
                {player.rank}
              </span>
              <span className="text-base leading-none" aria-hidden>{player.flag}</span>
              <span className={cn('text-sm font-semibold', player.you && 'text-neon')}>{player.name}</span>
            </div>
            <span className={cn('text-xs font-semibold', player.you ? 'text-neon' : 'text-muted-foreground')}>
              {formatThousands(player.points)} pts
            </span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

export { TopPlayersCard };
