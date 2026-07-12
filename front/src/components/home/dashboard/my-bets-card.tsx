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

// Each status reads distinctly: Open = pending neon outline (with live dot), Won = solid
// celebratory fill, Lost = danger-red tint, Void = muted neutral. (Open/Won were identical before.)
const STATUS_META: Record<BetStatus, { label: string; className: string; dotClassName?: string }> = {
  [BetStatus.Open]: {
    label: 'Open',
    className: 'text-neon border-neon/40 bg-neon/10',
    dotClassName: 'animate-pulse bg-neon',
  },
  [BetStatus.Won]: { label: 'Won', className: 'border-transparent bg-neon text-primary-foreground' },
  [BetStatus.Lost]: { label: 'Lost', className: 'text-danger border-danger/40 bg-danger/10' },
  [BetStatus.Void]: { label: 'Void', className: 'text-muted-foreground border-border bg-surface-2/60' },
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
          'inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0 font-mono text-[10px] leading-none font-bold uppercase',
          meta.className,
        )}
      >
        {meta.dotClassName && <span className={cn('size-1 rounded-full', meta.dotClassName)} />}
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
    <GlassPanel tone="surface" radius="xl" className="flex flex-1 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">My Bets</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-micro font-bold text-muted-foreground uppercase">
          <Ticket className="size-3.5" />
          {mounted ? `${open.length} open` : ''}
        </span>
      </div>
      {rows.length ? (
        // Trailing card of the right column — spreads its rows to fill any slack so the two dashboard
        // columns always end flush (no void before the Group Stage row). See MatchDashboard.
        <div className="flex flex-1 flex-col justify-between gap-1.5">
          {rows.map((bet) => (
            <BetRow key={bet.id} bet={bet} />
          ))}
        </div>
      ) : (
        <span className="flex flex-1 items-center text-xs text-muted-foreground">
          No bets yet — pick a market on the board (or an upcoming price) to get started.
        </span>
      )}
    </GlassPanel>
  );
}
