'use client';

import { Coins, ShieldCheck } from '@/components/common/icons';
import { cn } from '@/lib/utils';
import { BET_AMOUNTS } from '@/config/matchmaking.config';

/** Compact token amount — 1000 → "1k", matching the pool-style stake pills. */
export function formatTokens(amount: number) {
  return amount >= 1000 ? `${amount / 1000}k` : String(amount);
}

/** Pool-style stake picker for friendly challenges — both players put tokens on the line. */
export function BetSelector({
  amount,
  onSelect,
  className,
}: {
  amount: number;
  onSelect: (amount: number) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <span className="text-eyebrow flex items-center gap-1.5 text-muted-foreground">
        <Coins className="size-3.5 text-neon" weight="fill" />
        Bet amount
      </span>
      <div className="flex items-center gap-1.5">
        {BET_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            aria-pressed={value === amount}
            className={cn(
              'rounded-full border px-3.5 py-1 font-mono text-sm font-bold tabular-nums transition-colors',
              value === amount
                ? 'border-neon/50 bg-neon/10 text-neon'
                : 'border-border text-muted-foreground hover:border-neon/30 hover:text-foreground',
            )}
          >
            {formatTokens(value)}
          </button>
        ))}
      </div>
      <span className="text-micro flex items-center gap-1 text-muted-foreground">
        <ShieldCheck className="size-3.5 text-neon" />
        Winner takes {formatTokens(amount * 2)} tokens · Secured on Solana
      </span>
    </div>
  );
}
