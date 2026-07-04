import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { DuelResult } from '@/enums/duel-result.enum';
import { cn } from '@/lib/utils';
import type { PlayerProfile } from '@/config/duelists.config';

interface DuelHistoryListProps {
  profile: PlayerProfile;
}

interface MockDuelRow {
  id: string;
  opponent: string;
  result: DuelResult;
  score: string;
  relativeTime: string;
}

/** Display config for each result outcome — no switch/case. */
const duelResultConfig: Record<DuelResult, { label: string; className: string }> = {
  [DuelResult.Win]: { label: 'W', className: 'bg-neon/15 text-neon' },
  [DuelResult.Loss]: { label: 'L', className: 'bg-live/15 text-live' },
  [DuelResult.Draw]: { label: 'D', className: 'bg-muted-foreground/15 text-muted-foreground' },
};

/** Five representative mock rows generated from the profile (no network call). */
function buildMockRows(_profile: PlayerProfile): MockDuelRow[] {
  return [
    { id: 'r1', opponent: 'bleuforce', result: DuelResult.Win, score: '2–1', relativeTime: '8m' },
    { id: 'r2', opponent: 'PixelMessi10', result: DuelResult.Loss, score: '0–1', relativeTime: '31m' },
    { id: 'r3', opponent: 'GolMaster', result: DuelResult.Win, score: '3–2', relativeTime: '1h' },
    { id: 'r4', opponent: 'HatTrick23', result: DuelResult.Win, score: '1–0', relativeTime: '4h' },
    { id: 'r5', opponent: 'Canarinho', result: DuelResult.Loss, score: '1–2', relativeTime: '1d' },
  ];
}

/** Presentational list of recent 1v1 results for a public profile. */
export function DuelHistoryList({ profile }: DuelHistoryListProps) {
  const rows = buildMockRows(profile);

  return (
    <GlassPanel tone="surface" radius="xl" className="overflow-hidden">
      <SectionHeader title="Recent Duels" />

      <div className="flex flex-col divide-y divide-border/30">
        {rows.map((row) => {
          const { label, className } = duelResultConfig[row.result];
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
              <span className="flex-1 truncate text-sm font-medium">{row.opponent}</span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {row.score}
              </span>
              <span className="w-8 text-right text-micro text-muted-foreground">
                {row.relativeTime}
              </span>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
