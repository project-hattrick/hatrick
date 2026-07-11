'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { MarketIcon } from './market-icon';
import { lookup } from '@/lib/lookup';
import { cn } from '@/lib/utils';
import { marketTypeConfig, marketTypeFallback } from '@/config/market-type.config';
import { useLiveMarkets } from '@/hooks/use-live-markets';
import { useBetsStore } from '@/store/bets.store';
import { useDisplayMatch, useIsMatchLive } from '@/store/match.store';
import type { BetSelection } from '@/types/bet';

/** One tappable odds cell — highlights when it's the active bet-slip selection. */
function OddsCell({
  selection,
  active,
  disabled = false,
  onPick,
}: {
  selection: BetSelection;
  active: boolean;
  disabled?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        'flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45',
        active
          ? 'border-neon/70 bg-neon/10 text-foreground'
          : 'border-border/60 bg-surface-2/60 text-muted-foreground hover:border-border hover:text-foreground',
      )}
    >
      <span className="truncate text-xs font-semibold">{selection.label}</span>
      <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-neon">{selection.odds.toFixed(2)}</span>
    </button>
  );
}

/** Live odds board — pick a selection to load the bet slip. Config-driven, no switch. */
export function MarketsPanel() {
  const slip = useBetsStore((state) => state.slip);
  const select = useBetsStore((state) => state.select);
  const match = useDisplayMatch();
  const canBet = useIsMatchLive();
  const markets = useLiveMarkets();

  // Reflect the selected match: home/away selections carry the live team names instead of the static ARG/FRA.
  const label = (selection: BetSelection): BetSelection => {
    const team = selection.selectionId === 'home' ? match.home.name : selection.selectionId === 'away' ? match.away.name : null;
    return team ? { ...selection, label: team } : selection;
  };

  return (
    <GlassPanel radius="xl" tone="surface" className="flex flex-col divide-y divide-border/40 overflow-hidden">
      {!canBet && (
        <div className="bg-surface-1/70 px-4 py-2 text-xs font-semibold text-muted-foreground">
          Betting closed for this match.
        </div>
      )}
      {markets.map((def) => {
        const meta = lookup(marketTypeConfig, def.market, marketTypeFallback);
        return (
          <section key={def.market} className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-foreground uppercase">
              <MarketIcon market={def.market} className="size-4 text-neon" />
              {meta.label}
            </div>
            <div className="flex flex-wrap gap-2">
              {def.selections.map((selection) => {
                const display = label(selection);
                return (
                  <OddsCell
                    key={selection.selectionId}
                    selection={display}
                    active={slip?.market === selection.market && slip?.selectionId === selection.selectionId}
                    disabled={!canBet}
                    onPick={() => select(display)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </GlassPanel>
  );
}
