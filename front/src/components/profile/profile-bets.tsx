'use client';

import Link from 'next/link';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { BetRow } from '@/components/live/bet-row';
import { useOpenBets, useSettledBets } from '@/store/bets.store';

/** Recent bets panel for the signed-in profile — reads the live bets store. */
export function ProfileBets() {
  const open = useOpenBets();
  const settled = useSettledBets();
  const rows = [...open, ...settled].slice(0, 6);

  return (
    <GlassPanel radius="xl" tone="surface" className="flex flex-col overflow-hidden">
      <SectionHeader
        title="Bet & prediction history"
        action={
          <Link href="/bets" className="text-micro text-neon">
            View all
          </Link>
        }
      />
      {rows.length ? (
        <div className="flex flex-col divide-y divide-border/30">
          {rows.map((bet) => (
            <BetRow key={bet.id} bet={bet} />
          ))}
        </div>
      ) : (
        <p className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
          No bets yet —{' '}
          <Link href="/bets" className="mx-1 text-neon">
            place your first
          </Link>
          .
        </p>
      )}
    </GlassPanel>
  );
}
