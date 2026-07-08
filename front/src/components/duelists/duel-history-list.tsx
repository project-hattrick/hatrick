'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { DuelResult } from '@/enums/duel-result.enum';
import { cn } from '@/lib/utils';
import { useDuels } from '@/services/queries/use-duels';
import type { DuelHistoryDto } from '@/services/fantasy.service';

/** Display config for each result outcome — no switch/case. */
const duelResultConfig: Record<DuelResult, { label: string; className: string }> = {
  [DuelResult.Win]: { label: 'W', className: 'bg-neon/15 text-neon' },
  [DuelResult.Loss]: { label: 'L', className: 'bg-live/15 text-live' },
  [DuelResult.Draw]: { label: 'D', className: 'bg-muted-foreground/15 text-muted-foreground' },
};

/** Api result string ("Win") → front enum. */
const toResult = (r: DuelHistoryDto['hostResult']): DuelResult =>
  r ? (DuelResult[r as keyof typeof DuelResult] ?? DuelResult.Draw) : DuelResult.Draw;

/** Compact "8m / 1h / 2d" since a timestamp. */
const relativeTime = (iso: string | null): string => {
  if (!iso) return '';
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

/** The signed-in player's recent settled 1v1 results, from the api. */
export function DuelHistoryList() {
  const { data = [], isLoading } = useDuels();
  const rows = data.filter((d) => d.hostResult);

  return (
    <GlassPanel tone="surface" radius="xl" className="overflow-hidden">
      <SectionHeader title="Recent Duels" />

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {isLoading ? 'Loading…' : 'No duels yet — challenge a rival to start your record.'}
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border/30">
          {rows.map((row) => {
            const { label, className } = duelResultConfig[toResult(row.hostResult)];
            return (
              <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded text-eyebrow font-bold',
                    className,
                  )}
                >
                  {label}
                </span>
                <span className="flex-1 truncate text-sm font-medium">{row.opponentName ?? 'CPU'}</span>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {row.hostScore}–{row.guestScore}
                </span>
                <span className="w-8 text-right text-micro text-muted-foreground">
                  {relativeTime(row.finishedAt ?? row.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </GlassPanel>
  );
}
