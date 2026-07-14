'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';

import { GlassPanel } from '@/components/common/glass-panel';
import { WireBlock } from '@/components/common/wire-block';
import { Flag } from '@/components/common/flag';
import { Button } from '@/components/ui/button';
import { FormationPitch } from '@/components/home/widgets/formation-pitch';
import { Coins, Lightning, ShieldCheck, Clock } from '@/components/common/icons';
import { formatTokens } from '@/components/fantasy/bet-selector';
import { fifaToIso } from '@/lib/country';
import { useDuelDetail } from '@/services/queries/use-duel-detail';
import { duelService } from '@/services/fantasy.service';
import { isChainSession } from '@/services/session-mode';
import { useDepositDuelStake } from '@/services/queries/use-deposit-duel-stake';
import { useWalletStore } from '@/store/wallet.store';
import { useFantasyStore } from '@/store/fantasy.store';

interface JoinPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Guest join page — shown when the invited user accepts a PvP challenge.
 * Loads the duel details, lets the guest pick their XI, then calls POST /duels/:id/join.
 * After joining, the page waits for `duel:ready` (NavConsumer drives the navigation to /duel/[id]).
 */
export default function DuelJoinPage({ params }: JoinPageProps) {
  const { id } = use(params);
  const { data: duel, isLoading, isError } = useDuelDetail(id);
  const depositStake = useDepositDuelStake();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    if (!duel) return;
    setJoining(true);
    try {
      const fantasy = useFantasyStore.getState();
      const ownedCardIds = fantasy.squad
        .map((i) => fantasy.collection[i]?.ownedCardId)
        .filter(Boolean) as string[];

      if (!ownedCardIds.length) {
        toast.error('Build your XI in Fantasy before joining a duel.');
        return;
      }

      const res = await duelService.join(duel.id, {
        formation: fantasy.formation,
        ownedCardIds,
      });

      useWalletStore.getState().hydrate(Number(res.balance));

      const stake = Number(duel.stake);
      if (stake > 0 && isChainSession()) {
        await new Promise<void>((resolve, reject) => {
          depositStake.mutate(duel.id, {
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
          });
        });
        toast.success('Stake deposited on-chain');
      }

      setJoined(true);
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Failed to join duel');
    } finally {
      setJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <WireBlock label="Loading duel…" className="h-40 w-full max-w-sm" />
      </div>
    );
  }

  if (isError || !duel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <GlassPanel className="flex max-w-sm flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-muted-foreground">Could not load duel. The invite may have expired.</p>
        </GlassPanel>
      </div>
    );
  }

  const host = duel.host;
  const stake = Number(duel.stake);

  // After joining: show waiting state until duel:ready arrives (NavConsumer navigates).
  if (joined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <GlassPanel className="flex w-full max-w-sm flex-col items-center gap-6 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full border border-neon/30 bg-neon/[0.08]">
            <Clock className="size-8 text-neon" />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="font-heading text-title font-semibold">Locked in!</p>
            <p className="text-sm text-muted-foreground">
              Waiting for the match to start…
            </p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
      {/* Host identity + stake */}
      <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-4 p-5">
        <p className="text-eyebrow text-muted-foreground uppercase tracking-widest">You have been challenged</p>

        <div className="flex items-center gap-3">
          <span className="relative grid size-14 shrink-0 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-border">
            {host.avatarUrl && (
              <Image
                src={host.avatarUrl}
                alt={host.displayName ?? 'Host'}
                width={56}
                height={56}
                className="translate-y-[6%] scale-110 object-contain object-bottom"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5">
              {host.country && <Flag code={fifaToIso(host.country)} className="text-sm" />}
              <span className="font-bold">{host.displayName ?? host.username ?? 'Opponent'}</span>
            </span>
            <span className="text-micro text-muted-foreground">{host.mmr} MMR</span>
          </span>
        </div>

        {stake > 0 ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-neon/25 bg-neon/[0.05] px-4 py-2">
            <span className="flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums text-neon">
              <Coins className="size-4" weight="fill" />
              {formatTokens(stake)} tokens each
            </span>
            <span className="text-micro flex items-center gap-1 text-muted-foreground">
              <ShieldCheck className="size-3.5 text-neon" />
              Winner takes {formatTokens(stake * 2)} · Secured on Solana
            </span>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Friendly match — no tokens at stake.</p>
        )}
      </GlassPanel>

      {/* XI picker */}
      <FormationPitch />

      <Button
        size="lg"
        shape="pill"
        className="w-full gap-2 font-semibold"
        onClick={() => void handleJoin()}
        disabled={joining || depositStake.isPending}
      >
        <Lightning className="size-4" weight="fill" />
        {joining || depositStake.isPending
          ? stake > 0 && isChainSession() ? 'Depositing stake…' : 'Joining…'
          : 'Accept & enter the pitch'}
      </Button>
    </div>
  );
}
