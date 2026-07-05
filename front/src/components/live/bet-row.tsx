import { BetStatus } from '@/enums/bet-status.enum';
import { betStatusConfig, betStatusFallback } from '@/config/bet-status.config';
import { lookup } from '@/lib/lookup';
import { formatThousands } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Bet } from '@/types/bet';

/** Payout column: potential (stake × odds) while open or won, dash when lost. */
function payoutFor(bet: Bet): string {
  if (bet.status === BetStatus.Lost) return '—';
  return formatThousands(Math.round(bet.stake * bet.odds));
}

/** One bet history row — status pill · market/pick · match · stake @ odds · payout. */
export function BetRow({ bet }: { bet: Bet }) {
  const status = lookup(betStatusConfig, bet.status, betStatusFallback);
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={cn('w-11 shrink-0 rounded py-0.5 text-center text-[10px] font-bold uppercase', status.className)}>
        {status.label}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{bet.label}</span>
        <span className="text-micro text-muted-foreground">{bet.matchLabel}</span>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="font-mono text-sm tabular-nums">{payoutFor(bet)}</span>
        <span className="text-micro text-muted-foreground">
          {formatThousands(bet.stake)} @ {bet.odds.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
