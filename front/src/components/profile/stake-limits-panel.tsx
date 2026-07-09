'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coins } from '@/components/common/icons';
import { StakePeriod, StakeLimitOutcome } from '@/enums/stake-period.enum';
import {
  useStakeLimitsStore,
  resolveLimit,
  sumStakesSince,
  DAY_MS,
  WEEK_MS,
} from '@/store/stake-limits.store';
import { useBetsStore } from '@/store/bets.store';
import { formatThousands } from '@/lib/format';

const PERIODS = [
  { period: StakePeriod.Daily, label: 'Daily limit', windowMs: DAY_MS, spentLabel: 'today' },
  { period: StakePeriod.Weekly, label: 'Weekly limit', windowMs: WEEK_MS, spentLabel: 'this week' },
] as const;

/** Human-readable local date-time for a pending change's effective moment. */
function formatWhen(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

interface LimitRowProps {
  period: StakePeriod;
  label: string;
  windowMs: number;
  spentLabel: string;
  /** Stable "now" captured on mount by the parent (avoids per-render drift / SSR mismatch). */
  now: number;
}

function LimitRow({ period, label, windowMs, spentLabel, now }: LimitRowProps) {
  const entry = useStakeLimitsStore((s) => (period === StakePeriod.Daily ? s.daily : s.weekly));
  const setLimit = useStakeLimitsStore((s) => s.setLimit);
  const cancelPending = useStakeLimitsStore((s) => s.cancelPending);
  const open = useBetsStore((s) => s.open);
  const settled = useBetsStore((s) => s.settled);

  const resolved = resolveLimit(entry, now);
  const cap = resolved.limit;
  const spent = sumStakesSince([...open, ...settled], now - windowMs);
  const [draft, setDraft] = useState(cap === null ? '' : String(cap));

  // Resync the field when the active cap changes elsewhere (a save, or a matured pending change).
  useEffect(() => setDraft(cap === null ? '' : String(cap)), [cap]);

  function apply(value: number | null) {
    const outcome = setLimit(period, value);
    if (outcome === StakeLimitOutcome.Applied) {
      toast.success(value === null ? `${label} removed.` : `${label} set to ${formatThousands(value)} coins.`);
    } else if (outcome === StakeLimitOutcome.Scheduled) {
      toast.success(
        value === null
          ? `Removing your ${label.toLowerCase()} takes effect after a 24-hour review.`
          : `${label} increase to ${formatThousands(value)} scheduled — effective after a 24-hour review.`,
      );
    } else {
      toast.info(`That's already your ${label.toLowerCase()}.`);
    }
  }

  function onSave() {
    const trimmed = draft.trim();
    if (trimmed === '') {
      apply(null);
      return;
    }
    const value = Math.round(Number(trimmed));
    if (!Number.isFinite(value) || value < 1) {
      toast.error('Enter a whole number of coins, or clear the field to remove the limit.');
      return;
    }
    apply(value);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">{label}</span>
        <span className="text-micro text-muted-foreground tabular-nums">
          {cap === null ? 'No limit' : `${formatThousands(cap)} cap`} · {formatThousands(spent)} {spentLabel}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="No limit"
          className="flex-1"
        />
        <Button size="sm" onClick={onSave}>
          Save
        </Button>
        {cap !== null && !resolved.pending && (
          <Button variant="ghost" size="sm" onClick={() => apply(null)}>
            Remove
          </Button>
        )}
      </div>

      {resolved.pending && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-surface-2/50 px-3 py-2">
          <span className="text-micro text-muted-foreground">
            {resolved.pending.value === null
              ? 'Removal'
              : `Increase to ${formatThousands(resolved.pending.value)}`}{' '}
            pending · effective <span className="text-foreground">{formatWhen(resolved.pending.effectiveAt)}</span>
          </span>
          <Button variant="ghost" size="xs" onClick={() => cancelPending(period)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Daily/weekly stake-limit controls in the account Settings dialog, backing the Responsible
 * Gaming policy.
 * Tightening applies instantly; raising or removing a limit is deferred by a 24h review.
 * Rendered client-side once mounted (limits + bet ledger live in localStorage).
 */
export function StakeLimitsPanel() {
  const applyMatured = useStakeLimitsStore((s) => s.applyMatured);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    applyMatured();
    setNow(Date.now());
  }, [applyMatured]);

  if (now === null) return null;

  return (
    <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
      <SectionHeader title="Stake limits" action={<Coins className="size-3.5 text-neon" />} />
      <div className="flex flex-col gap-5 p-4 pt-0">
        {PERIODS.map((p) => (
          <LimitRow key={p.period} {...p} now={now} />
        ))}
        <p className="text-micro text-muted-foreground">
          Lowering a limit applies instantly. Raising or removing one takes effect after a 24-hour
          review period. Limits cap total staked in each rolling window · devnet play-money.
        </p>
      </div>
    </GlassPanel>
  );
}
