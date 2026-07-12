'use client';

import { type ReactNode } from 'react';

import { MetalButton } from '@/components/ui/metal-button';
import { Flag } from '@/components/common/flag';
import { MarketType } from '@/enums/market-type.enum';
import { useLiveMarkets } from '@/hooks/use-live-markets';
import { useFixtureScoreQuery } from '@/services/queries/use-replay';
import { fifaToIso } from '@/lib/country';
import { impliedPercents, matchResultWinner } from '@/lib/implied-odds';
import { cn } from '@/lib/utils';
import { useBetsStore } from '@/store/bets.store';
import { useDisplayMatch, useIsMatchLive, useIsReplay } from '@/store/match.store';
import type { LiveMatch } from '@/types/match';
import type { BetSelection } from '@/types/bet';

/** Bezel frame shared by the live betting dock and the read-only past-match variant. */
function DockFrame({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-auto w-[min(560px,94vw)] rounded-[26px] bg-muted p-1.5 shadow-[0px_0px_0px_1px_rgba(255,255,255,0.05),0px_2px_6px_rgba(0,0,0,0.4),0px_16px_40px_-12px_rgba(0,0,0,0.55)]">
      <div className="flex flex-col gap-2 rounded-[20px] bg-overlay/85 p-2.5 ring-1 ring-white/10 backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}

/**
 * Past-match variant: this game already happened (a replay), so the headline card is read-only and
 * shows the AUTHORITATIVE final result (goals + winner) whatever minute the playback is at. Implied
 * win probability is only the fallback while the final score hasn't loaded yet.
 */
function PastResultDock({
  match,
  selections,
  final,
}: {
  match: LiveMatch;
  selections: Record<string, BetSelection | undefined>;
  final: { home: number; away: number } | null;
}) {
  const order: Array<{ id: 'home' | 'draw' | 'away'; label: string; code: string | null }> = [
    { id: 'home', label: match.home.name, code: match.home.code },
    { id: 'draw', label: 'Draw', code: null },
    { id: 'away', label: match.away.name, code: match.away.code },
  ];
  const present = order.map((o) => selections[o.id]).filter(Boolean) as BetSelection[];
  const pct = impliedPercents(present);
  const winner = final ? matchResultWinner(final.home, final.away) : null;
  const valueFor = (id: 'home' | 'draw' | 'away'): string => {
    if (!final) return `${pct[id] ?? 0}%`;
    return id === 'draw' ? '–' : String(final[id]);
  };

  return (
    <DockFrame>
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-micro font-bold tracking-[0.16em] text-muted-foreground uppercase">
          ● Match result · already played
        </span>
        <span className="font-mono text-micro font-semibold text-neon uppercase">
          {final ? 'Final result' : 'Win probability'}
        </span>
      </div>
      <div className="flex items-stretch gap-1.5">
        {order.map((o) => {
          const won = winner === o.id;
          return (
            <div
              key={o.id}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[15px] border px-3 py-2.5 text-center',
                o.id === 'draw' ? 'flex-1' : 'flex-[1.4]',
                won ? 'border-neon bg-neon/15' : 'border-white/12 bg-white/[0.06]',
              )}
            >
              <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-foreground">
                {o.code && <Flag code={fifaToIso(o.code)} className="shrink-0" />}
                <span className="truncate">{o.label}</span>
              </span>
              <span className={cn('font-mono text-lg font-bold tabular-nums', won ? 'text-neon' : 'text-foreground')}>
                {valueFor(o.id)}
              </span>
              {final && (
                <span className={cn('text-micro font-bold uppercase tracking-wide', won ? 'text-neon' : 'text-muted-foreground/60')}>
                  {won ? (o.id === 'draw' ? 'Draw' : 'Winner') : '—'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </DockFrame>
  );
}

/**
 * The room's headline bet, front and centre: Match Result (1·X·2) as metal buttons — the same
 * chromatic treatment as the hero's prediction dock, because this is THE bet of a watch party.
 * Odds are live (TxLINE book with static fallback); picking loads the shared BetSlip. Hidden once
 * betting closes (the winner screen owns full-time).
 */
export function RoomResultDock() {
  const match = useDisplayMatch();
  const canBet = useIsMatchLive();
  const isReplay = useIsReplay();
  const markets = useLiveMarkets();
  const slip = useBetsStore((state) => state.slip);
  const select = useBetsStore((state) => state.select);
  // Replays are finished matches — fetch the authoritative final so the card never shows minute data.
  const finalScoreQuery = useFixtureScoreQuery(isReplay ? match.fixtureId : null);

  const def = markets.find((market) => market.market === MarketType.MatchResult);
  if (!def) return null;

  const selections = Object.fromEntries(def.selections.map((s) => [s.selectionId, s])) as Record<
    string,
    BetSelection | undefined
  >;
  const home = selections.home;
  const draw = selections.draw;
  const away = selections.away;
  if (!home || !draw || !away) return null;

  // A replay already happened → read-only final-result card, never a bet.
  if (isReplay) {
    const snap = finalScoreQuery.data;
    const final = snap?.finished ? { home: snap.home, away: snap.away } : null;
    return <PastResultDock match={match} selections={selections} final={final} />;
  }
  // Real full-time (non-replay): the winner screen owns the moment — hide the dock (unchanged).
  if (!canBet) return null;

  const isActive = (selection: BetSelection) =>
    slip?.market === selection.market && slip?.selectionId === selection.selectionId;
  const pickTeam = (selection: BetSelection, name: string) => select({ ...selection, label: name });

  return (
    <DockFrame>
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-micro font-bold tracking-[0.16em] text-neon uppercase">
          ● Match result · who wins?
        </span>
        <span className="font-mono text-micro font-semibold text-muted-foreground uppercase">1 · X · 2</span>
      </div>

      <div className="flex items-stretch gap-1.5">
        <MetalButton
            type="button"
            preset="chromatic"
            variant="default"
            strength={1}
            ringCssPx={3}
            onClick={() => pickTeam(home, match.home.name)}
            metalFxClassName={cn(
              'flex-[1.4] cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]',
              isActive(home) && 'ring-2 ring-neon rounded-[15px]',
            )}
            className="w-full cursor-pointer justify-between gap-1.5 px-3 py-3 text-sm font-bold text-primary-foreground"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <Flag code={fifaToIso(match.home.code)} className="shrink-0" />
              <span className="truncate">{match.home.name}</span>
            </span>
            <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-primary-foreground/85">
              {home.odds.toFixed(2)}
            </span>
          </MetalButton>

          <button
            type="button"
            onClick={() => select(draw)}
            className={cn(
              'flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-1.5 rounded-[15px] border border-white/15 bg-white/10 px-3 py-3 text-foreground backdrop-blur-sm transition hover:bg-white/15 active:scale-[0.98]',
              isActive(draw) && 'border-neon/70 bg-neon/10',
            )}
          >
            <span className="text-sm font-semibold">Draw</span>
            <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-muted-foreground">
              {draw.odds.toFixed(2)}
            </span>
          </button>

          <MetalButton
            type="button"
            preset="chromatic"
            variant="default"
            strength={1}
            ringCssPx={3}
            onClick={() => pickTeam(away, match.away.name)}
            metalFxClassName={cn(
              'flex-[1.4] cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]',
              isActive(away) && 'ring-2 ring-neon rounded-[15px]',
            )}
            className="w-full cursor-pointer justify-between gap-1.5 px-3 py-3 text-sm font-bold text-primary-foreground"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <Flag code={fifaToIso(match.away.code)} className="shrink-0" />
              <span className="truncate">{match.away.name}</span>
            </span>
            <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-primary-foreground/85">
              {away.odds.toFixed(2)}
            </span>
          </MetalButton>
        </div>
    </DockFrame>
  );
}
