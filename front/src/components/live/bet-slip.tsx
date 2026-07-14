'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';
import { Ticket, X, ShieldWarning, Trophy } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useZodForm } from '@/hooks/use-zod-form';
import { useAuth } from '@/services/queries/use-auth';
import { useRequireAuth } from '@/services/queries/use-require-auth';
import { usePlaceBet, type PlaceBetVars } from '@/services/queries/use-place-bet';
import { useBetsStore } from '@/store/bets.store';
import { useIsMatchLive } from '@/store/match.store';
import { useResponsibleGamingStore } from '@/store/responsible-gaming.store';
import {
  useStakeLimitsStore,
  effectiveLimit,
  sumStakesSince,
  DAY_MS,
  WEEK_MS,
  type StakeLimit,
  type StakedEntry,
} from '@/store/stake-limits.store';
import { useBalance } from '@/store/wallet.store';
import { useMatchStore } from '@/store/match.store';
import { isChainSession } from '@/services/session-mode';
import { useChainBalance } from '@/services/queries/use-chain-balance';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';
import { formatThousands } from '@/lib/format';

/** Remaining stake allowance for a period (null = no limit set). */
function remainingAllowance(entry: StakeLimit, ledger: StakedEntry[], windowMs: number, now: number): number | null {
  const cap = effectiveLimit(entry, now);
  if (cap === null) return null;
  return Math.max(0, cap - sumStakesSince(ledger, now - windowMs));
}

const schema = z.object({ stake: z.coerce.number().int('Whole coins only').min(1, 'Enter a stake') });
type FormValues = z.infer<typeof schema>;

/** Live bet slip — the staked counterpart to the free prediction dock. */
export function BetSlip() {
  const slip = useBetsStore((state) => state.slip);
  const clearSlip = useBetsStore((state) => state.clearSlip);
  const setStake = useBetsStore((state) => state.setStake);
  const place = useBetsStore((state) => state.place);
  const excludedUntil = useResponsibleGamingStore((state) => state.excludedUntil);
  const openBets = useBetsStore((state) => state.open);
  const settledBets = useBetsStore((state) => state.settled);
  const dailyLimit = useStakeLimitsStore((state) => state.daily);
  const weeklyLimit = useStakeLimitsStore((state) => state.weekly);
  const playMoneyBalance = useBalance();
  const requireAuth = useRequireAuth();
  const { isAuthenticated, isCompetitor } = useAuth();
  const canBet = useIsMatchLive();
  const { publicKey } = useWallet();
  const placeBetOnChain = usePlaceBet();
  const { data: chainBalanceData } = useChainBalance();
  const fixtureId = useMatchStore((s) => s.match?.fixtureId ?? MOCK_FIXTURE_ID);

  // When chain is active, show the on-chain play-token balance; otherwise play-money.
  const chainActive = isChainSession() && publicKey !== null;
  const balance = chainActive
    ? Number(chainBalanceData?.playToken ?? playMoneyBalance)
    : playMoneyBalance;

  // Mounted gate: store values rehydrate from localStorage on the client only, so we
  // treat the user as active/unlimited until mounted to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const selfExcluded = mounted && excludedUntil !== null;
  // Collectors (email tier) watch and collect — betting is Competitor-only.
  const collectorOnly = mounted && isAuthenticated && !isCompetitor;

  const ledger = [...openBets, ...settledBets];
  const now = mounted ? Date.now() : 0;
  const dailyLeft = mounted ? remainingAllowance(dailyLimit, ledger, DAY_MS, now) : null;
  const weeklyLeft = mounted ? remainingAllowance(weeklyLimit, ledger, WEEK_MS, now) : null;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useZodForm<FormValues>(schema, { defaultValues: { stake: 100 } });

  const stake = Number(watch('stake')) || 0;
  const potential = slip ? Math.round(stake * slip.odds) : 0;

  // Shared validation that applies to both on-chain and play-money paths.
  function validateBet(values: FormValues): boolean {
    if (!slip) return false;
    if (!canBet) {
      toast.error('Betting is closed for this match.');
      clearSlip();
      return false;
    }
    if (selfExcluded) {
      toast.error("You're self-excluded from betting. Manage this in Settings (account menu).");
      return false;
    }
    if (!requireAuth()) return false;
    if (collectorOnly) {
      toast.error('Betting is for Competitors — sign in with a wallet to place bets.');
      return false;
    }
    if (values.stake > balance) {
      toast.error('Not enough coins for this stake.');
      return false;
    }
    if (dailyLeft !== null && values.stake > dailyLeft) {
      toast.error(`Daily stake limit reached — ${formatThousands(dailyLeft)} left today. Adjust it in Settings.`);
      return false;
    }
    if (weeklyLeft !== null && values.stake > weeklyLeft) {
      toast.error(`Weekly stake limit reached — ${formatThousands(weeklyLeft)} left this week. Adjust it in Settings.`);
      return false;
    }
    return true;
  }

  function onSubmit(values: FormValues) {
    if (!validateBet(values) || !slip) return;

    // On-chain path: sign + send the built Solana tx.
    if (chainActive) {
      const vars: PlaceBetVars = {
        fixtureId,
        market: slip.market,
        selection: slip.selectionId,
        amount: values.stake,
        oddsBps: Math.round(slip.odds * 100),
      };
      placeBetOnChain.mutate(vars, {
        onSuccess: () => {
          toast.success(`Bet placed on-chain · ${slip.label} @ ${slip.odds.toFixed(2)}`);
          clearSlip();
          reset({ stake: 100 });
        },
        onError: (err) => {
          toast.error((err as Error)?.message ?? 'On-chain bet failed');
        },
      });
      return;
    }

    // Play-money path (default, unchanged).
    setStake(values.stake);
    const bet = place();
    if (bet) {
      toast.success(`Bet placed · ${bet.label} @ ${bet.odds.toFixed(2)}`);
      reset({ stake: 100 });
    }
  }

  return (
    <GlassPanel radius="xl" tone="dark" className="overflow-hidden">
      <SectionHeader title="Bet slip" action={<Ticket className="size-3.5 text-neon" />} />
      {!canBet ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <Ticket className="size-6 text-muted-foreground/60" />
          <span className="text-sm font-medium text-foreground">Betting closed</span>
          <span className="text-micro text-muted-foreground">This match is already final.</span>
        </div>
      ) : selfExcluded ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <ShieldWarning className="size-6 text-neon" weight="duotone" />
          <span className="text-sm font-medium text-foreground">You're self-excluded</span>
          <span className="text-micro text-muted-foreground">
            Betting is paused at your request. Manage this from{' '}
            <Link href="/profile" className="text-neon underline-offset-2 hover:underline">
              your profile
            </Link>
            .
          </span>
        </div>
      ) : collectorOnly ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <Trophy className="size-6 text-neon" weight="duotone" />
          <span className="text-sm font-medium text-foreground">Competitors only</span>
          <span className="text-micro text-muted-foreground">
            Betting needs a wallet-linked account. Packs and live stats are all yours.
          </span>
        </div>
      ) : slip ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3 p-4 pt-0">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-surface-2/60 px-3 py-2">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold">{slip.label}</span>
              <span className="text-micro text-muted-foreground">{slip.market}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-mono text-sm font-bold text-neon tabular-nums">{slip.odds.toFixed(2)}</span>
              <button
                type="button"
                aria-label="Clear selection"
                onClick={clearSlip}
                className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Input type="number" min={1} step={1} placeholder="Stake" aria-invalid={!!errors.stake} {...register('stake')} />
            {errors.stake && <span className="ml-1 text-xs text-destructive">{errors.stake.message}</span>}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Potential return</span>
            <span className="font-bold text-neon tabular-nums">{formatThousands(potential)}</span>
          </div>

          <Button type="submit" className="w-full" disabled={placeBetOnChain.isPending}>
            {placeBetOnChain.isPending ? 'Confirming…' : 'Place bet'}
          </Button>
          <span className="flex items-center gap-1.5 text-micro text-muted-foreground">
            <Image src="/coin.png" alt="" width={12} height={12} className="size-3" />
            {formatThousands(balance)} available · {chainActive ? 'on-chain · devnet' : 'devnet play-money'}
          </span>
          {(dailyLeft !== null || weeklyLeft !== null) && (
            <span className="text-micro text-muted-foreground">
              {dailyLeft !== null && (
                <>
                  Daily left <span className="text-foreground tabular-nums">{formatThousands(dailyLeft)}</span>
                </>
              )}
              {dailyLeft !== null && weeklyLeft !== null && ' · '}
              {weeklyLeft !== null && (
                <>
                  Weekly left <span className="text-foreground tabular-nums">{formatThousands(weeklyLeft)}</span>
                </>
              )}
            </span>
          )}
        </form>
      ) : (
        <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
          <Ticket className="size-6 text-muted-foreground/60" />
          <span className="text-sm font-medium text-muted-foreground">Your slip is empty</span>
          <span className="text-micro text-muted-foreground">Pick a selection from the odds board.</span>
        </div>
      )}
    </GlassPanel>
  );
}
