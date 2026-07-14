'use client';

import { use } from 'react';
import { GlassPanel } from '@/components/common/glass-panel';
import { WireBlock } from '@/components/common/wire-block';
import { Sword, Clock } from '@/components/common/icons';
import { useDuelDetail } from '@/services/queries/use-duel-detail';
import { formatTokens } from '@/components/fantasy/bet-selector';

interface WaitingPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Host waiting screen — shown after creating a PvP duel, while the guest has not yet joined.
 * The page stays here until `duel:ready` fires (NavConsumer handles the navigation).
 */
export default function DuelWaitingPage({ params }: WaitingPageProps) {
  const { id } = use(params);
  const { data: duel, isLoading, isError } = useDuelDetail(id);

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
          <p className="text-sm text-muted-foreground">Could not load duel details. Please try again.</p>
        </GlassPanel>
      </div>
    );
  }

  const guestName = duel.guest?.displayName ?? duel.guest?.username ?? 'your opponent';
  const stake = Number(duel.stake);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <GlassPanel className="flex w-full max-w-sm flex-col items-center gap-6 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-neon/30 bg-neon/[0.08]">
          <Clock className="size-8 text-neon" />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="font-heading text-title font-semibold">Waiting for your opponent…</p>
          <p className="text-sm text-muted-foreground">
            An invite has been sent to{' '}
            <span className="font-semibold text-foreground">{guestName}</span>.
            The match will start automatically when they accept.
          </p>
        </div>

        {stake > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-neon/25 bg-neon/[0.06] px-4 py-2.5">
            <Sword className="size-4 text-neon" weight="fill" />
            <span className="font-mono text-sm font-bold text-neon">
              {formatTokens(stake)} vs {formatTokens(stake)} · {formatTokens(stake * 2)} pot
            </span>
          </div>
        )}

        <p className="text-micro text-muted-foreground">
          Duel ID: <span className="font-mono">{duel.id.slice(0, 8)}</span>
        </p>
      </GlassPanel>
    </div>
  );
}
