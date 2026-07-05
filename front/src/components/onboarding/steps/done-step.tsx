'use client';

import { Confetti, Package, SoccerBall, Star } from '@/components/common/icons';
import { cn } from '@/lib/utils';
import type { PackCard } from '@/config/pack-pool.config';

/** Final step — a compact recap. The flow footer owns the CTAs. */
export function DoneStep({ collection, squadCount }: { collection: PackCard[]; squadCount: number }) {
  const best = collection.reduce<PackCard | null>(
    (top, card) => ((card.number ?? 0) > (top?.number ?? 0) ? card : top),
    null,
  );

  const stats = [
    { icon: Package, value: collection.length, label: 'cards' },
    { icon: SoccerBall, value: squadCount, label: 'in XI' },
    { icon: Star, value: best?.number ?? '—', label: best ? best.name : 'best', gold: true },
  ];

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-neon/15 text-neon">
        <Confetti className="size-7" weight="fill" />
      </span>
      <p className="text-lead font-semibold">Your squad is ready.</p>

      <div className="grid w-full grid-cols-3 gap-2">
        {stats.map(({ icon: Icon, value, label, gold }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-surface-2/60 p-4">
            <Icon className={cn('size-5', gold ? 'text-medal-gold' : 'text-muted-foreground')} weight="fill" />
            <span className="font-mono text-lg font-bold tabular-nums">{value}</span>
            <span className="text-micro truncate text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
