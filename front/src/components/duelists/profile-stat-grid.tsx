import { GlassPanel } from '@/components/common/glass-panel';
import { cn } from '@/lib/utils';
import { env } from '@/lib/env';
import { statTiles } from '@/config/profile-mock';
import type { PlayerProfile } from '@/config/duelists.config';

const CARDS_LABEL = 'Cards';

/**
 * Four headline stat tiles (duels, win rate, MMR, cards). Duels/win-rate/MMR come
 * from the profile (real ranking fields in backend mode). The Cards tile is real
 * when `cardCount` is provided (own profile); otherwise it falls back to the mock
 * hash in mock mode and an honest em dash in backend mode (no public collection).
 */
export function ProfileStatGrid({
  profile,
  cardCount,
  className,
}: {
  profile: PlayerProfile;
  cardCount?: number | null;
  className?: string;
}) {
  const tiles = statTiles(profile).map((tile) => {
    if (tile.label !== CARDS_LABEL) return tile;
    if (cardCount !== undefined) return { ...tile, value: cardCount === null ? '—' : String(cardCount) };
    return env.useMock ? tile : { ...tile, value: '—' };
  });

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {tiles.map((tile) => (
        <GlassPanel
          key={tile.label}
          tone="dark"
          radius="xl"
          className={cn('flex flex-col justify-center p-4', tile.accent && 'border-neon/25')}
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
