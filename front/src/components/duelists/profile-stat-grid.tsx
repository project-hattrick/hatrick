import { GlassPanel } from '@/components/common/glass-panel';
import { cn } from '@/lib/utils';
import { statTiles } from '@/config/profile-mock';
import type { PlayerProfile } from '@/config/duelists.config';

/** Four headline stat tiles (duels, win rate, MMR, cards). */
export function ProfileStatGrid({ profile }: { profile: PlayerProfile }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {statTiles(profile).map((tile) => (
        <GlassPanel
          key={tile.label}
          tone="dark"
          radius="xl"
          className={cn('p-4', tile.accent && 'border-neon/25')}
        >
          <div
            className={cn(
              'font-mono text-2xl font-bold tabular-nums',
              tile.accent ? 'text-neon' : 'text-foreground',
            )}
          >
            {tile.value}
          </div>
          <div className="text-micro mt-1 text-muted-foreground">{tile.label}</div>
        </GlassPanel>
      ))}
    </div>
  );
}
