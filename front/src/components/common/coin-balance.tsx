'use client';

import Image from 'next/image';
import { Plus } from '@/components/common/icons';
import { useBalance } from '@/store/wallet.store';
import { formatThousands } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Live play-money coin balance chip (packs · market · bets share this ledger). */
export function CoinBalance({ className, showAdd = true }: { className?: string; showAdd?: boolean }) {
  const balance = useBalance();
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border border-border/60 bg-surface-2/80 py-1.5 pr-1.5 pl-3',
        className,
      )}
    >
      <Image src="/coin.png" alt="Coins" width={18} height={18} className="size-4" />
      <span suppressHydrationWarning className="text-sm font-bold tabular-nums">
        {formatThousands(balance)}
      </span>
      {showAdd && (
        <span className="grid size-6 place-items-center rounded-full bg-neon text-black">
          <Plus className="size-3.5" />
        </span>
      )}
    </div>
  );
}
