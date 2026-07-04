import Link from 'next/link';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { formatThousands } from '@/lib/format';
import { cn } from '@/lib/utils';

enum BetStatus {
  Won = 'won',
  Lost = 'lost',
  Open = 'open',
}

interface MockBetRow {
  id: string;
  market: string;
  pick: string;
  match: string;
  stake: number;
  odds: number;
  status: BetStatus;
}

/** Display config per outcome — no switch/case. */
const betStatusConfig: Record<BetStatus, { label: string; className: string }> = {
  [BetStatus.Won]: { label: 'Won', className: 'bg-neon/15 text-neon' },
  [BetStatus.Lost]: { label: 'Lost', className: 'bg-live/15 text-live' },
  [BetStatus.Open]: { label: 'Open', className: 'bg-warning/15 text-warning' },
};

/** Representative mock rows until the api exposes bet history (no network call). */
const ROWS: MockBetRow[] = [
  { id: 'b1', market: 'Match winner', pick: 'France', match: 'FRA vs ESP', stake: 250, odds: 1.85, status: BetStatus.Open },
  { id: 'b2', market: 'Total goals', pick: 'Over 2.5', match: 'BRA vs ARG', stake: 120, odds: 2.1, status: BetStatus.Won },
  { id: 'b3', market: 'Next goal', pick: 'Mbappé', match: 'FRA vs ESP', stake: 80, odds: 3.4, status: BetStatus.Lost },
  { id: 'b4', market: 'Both teams score', pick: 'Yes', match: 'GER vs NED', stake: 150, odds: 1.62, status: BetStatus.Won },
  { id: 'b5', market: 'Correct score', pick: '2–1', match: 'ITA vs POR', stake: 60, odds: 8.5, status: BetStatus.Lost },
];

/** Payout column: potential (stake × odds) for open bets, settled amount otherwise. */
const payoutFor = (row: MockBetRow): string =>
  row.status === BetStatus.Lost ? '—' : formatThousands(Math.round(row.stake * row.odds));

/** Recent bets & predictions panel for the signed-in profile (mock rows, DS-token colors). */
export function ProfileBets() {
  return (
    <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
      <SectionHeader
        title="Bet & prediction history"
        action={
          <Link href="/bets" className="text-[10px] text-neon">
            View all
          </Link>
        }
      />
      <div className="flex flex-col divide-y divide-border/30">
        {ROWS.map((row) => {
          const status = betStatusConfig[row.status];
          return (
            <div key={row.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cn('w-11 shrink-0 rounded py-0.5 text-center text-[10px] font-bold uppercase', status.className)}>
                {status.label}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {row.market} · {row.pick}
                </span>
                <span className="text-micro text-muted-foreground">{row.match}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="font-mono text-sm tabular-nums">{payoutFor(row)}</span>
                <span className="text-micro text-muted-foreground">
                  {formatThousands(row.stake)} @ {row.odds.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
