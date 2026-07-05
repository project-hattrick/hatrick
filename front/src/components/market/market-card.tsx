'use client';

import Image from 'next/image';
import { HoloPlayerCard } from '@/components/store/holo-player-card';
import { Button } from '@/components/ui/button';
import { formatThousands } from '@/lib/format';
import type { PackCard } from '@/config/pack-pool.config';

/** A market tile — holo card, name and a coin-priced buy/sell action. */
export function MarketCard({
  card,
  price,
  actionLabel,
  onAction,
}: {
  card: PackCard;
  price: number;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <HoloPlayerCard {...card} width={140} />
      <span className="w-full truncate text-center text-xs font-semibold">{card.name}</span>
      <Button size="sm" className="w-full gap-1.5" onClick={onAction}>
        <Image src="/coin.png" alt="" width={12} height={12} className="size-3" />
        {formatThousands(price)}
        <span className="text-primary-foreground/70">· {actionLabel}</span>
      </Button>
    </div>
  );
}
