'use client';

import { cn } from '@/lib/utils';
import type { BetSelection } from '@/types/bet';

interface CellProps {
  selection: BetSelection;
  active: boolean;
  disabled?: boolean;
  onPick: () => void;
}

/**
 * Featured 1·X·2 cell for the Match Result market — big odds, a team-colour
 * accent, and a lively hover lift. Room-only (the shared MarketsPanel keeps its
 * plain OddsCell).
 */
export function FeaturedResultCell({
  selection,
  accentColor,
  active,
  disabled = false,
  onPick,
}: CellProps & { accentColor: string | null }) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        'relative flex min-w-0 cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-xl border px-2 py-3 transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0',
        active
          ? 'border-neon bg-neon/15 shadow-[0_0_18px_rgba(174,240,25,0.25)]'
          : 'border-border/60 bg-surface-2/60 hover:border-neon/40',
      )}
    >
      {accentColor && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-14 opacity-50"
          style={{ background: `linear-gradient(180deg, ${accentColor}55 0%, transparent 100%)` }}
        />
      )}
      <span className="relative max-w-full truncate text-micro font-semibold tracking-wide text-foreground/85 uppercase">
        {selection.label}
      </span>
      <span className={cn('relative font-mono text-xl font-bold tabular-nums', active ? 'text-neon' : 'text-foreground')}>
        {selection.odds.toFixed(2)}
      </span>
    </button>
  );
}

/** Livelier secondary odds cell — gradient surface, hover lift, neon active state. */
export function LivelyOddsCell({ selection, active, disabled = false, onPick }: CellProps) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        'flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0',
        active
          ? 'border-neon bg-neon/15 text-foreground shadow-[0_0_14px_rgba(174,240,25,0.2)]'
          : 'border-border/50 bg-gradient-to-b from-surface-2/80 to-surface-3/40 text-muted-foreground hover:border-neon/40 hover:text-foreground',
      )}
    >
      <span className="truncate text-xs font-semibold">{selection.label}</span>
      <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-neon">{selection.odds.toFixed(2)}</span>
    </button>
  );
}
