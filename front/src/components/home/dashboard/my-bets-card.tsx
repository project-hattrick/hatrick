'use client';

import { useSyncExternalStore } from 'react';

import { GlassPanel } from '@/components/common/glass-panel';
import { Ticket } from '@/components/common/icons';
import { BetStatus } from '@/enums/bet-status.enum';
import { cn } from '@/lib/utils';
import { formatThousands } from '@/lib/format';
import { useBetsStore } from '@/store/bets.store';
import type { Bet } from '@/types/bet';

const MAX_ROWS = 6;

const STATUS_META: Record<BetStatus, { label: string; className: string }> = {
  [BetStatus.Open]: { label: 'Open', className: 'text-neon border-neon/50 bg-neon/10' },
  [BetStatus.Won]: { label: 'Won', className: 'text-neon border-neon/50 bg-neon/10' },
  [BetStatus.Lost]: { label: 'Lost', className: 'text-muted-foreground border-border bg-surface-2/60' },
  [BetStatus.Void]: { label: 'Void', className: 'text-chart-4 border-chart-4/50 bg-chart-4/10' },
};

function BetRow({ bet }: { bet: Bet }) {
  const meta = STATUS_META[bet.status];
  return (
    <div className="flex items-center gap-2 rounded-xl bg-overlay/30 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{bet.label}</p>
        <p className="font-mono text-micro text-muted-foreground">
          {bet.matchLabel} · ×{bet.odds.toFixed(2)} · {formatThousands(bet.stake)} coins
        </p>
      </div>
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-micro font-bold uppercase',
          meta.className,
        )}
      >
        {bet.status === BetStatus.Open && <span className="size-1.5 animate-pulse rounded-full bg-neon" />}
        {meta.label}
      </span>
    </div>
  );
}

// Hydration gate: false on the server render, true on the client — the store is persisted, so
// rendering its rows before hydration would mismatch. (The sanctioned no-effect pattern.)
const emptySubscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

/** The user's recent bets (open first, then settled) so the board reads as a living ledger. */
export function MyBetsCard() {
  const open = useBetsStore((state) => state.open);
  const settled = useBetsStore((state) => state.settled);
  const mounted = useHydrated();
  const rows = mounted ? [...open, ...settled].slice(0, MAX_ROWS) : [];

  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">My Bets</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-micro font-bold text-muted-foreground uppercase">
          <Ticket className="size-3.5" />
          {mounted ? `${open.length} open` : ''}
        </span>
      </div>
      {rows.length ? (
        <div className="flex flex-col gap-1.5">
          {rows.map((bet) => (
            <BetRow key={bet.id} bet={bet} />
          ))}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">
          No bets yet — pick a market on the board (or an upcoming price) to get started.
        </span>
      )}
    </GlassPanel>
  );
}
