'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Confetti, Fire, Handshake } from '@/components/common/icons';
import { DuelResult } from '@/enums/duel-result.enum';
import { MMR_STAKE } from '@/config/matchmaking.config';
import { selfProfile } from '@/config/duelists.config';
import { useDuelStore } from '@/store/duel.store';

interface ResultMeta {
  title: string;
  /** Tailwind text-color class applied to title and MMR delta. */
  accent: string;
  icon: ReactNode;
  mmrDelta: number;
}

/** Config-driven result presentation — no switch/case. */
const RESULT_CONFIG: Record<DuelResult, ResultMeta> = {
  [DuelResult.Win]: {
    title: 'Victory!',
    accent: 'text-neon',
    icon: <Confetti className="size-8" />,
    mmrDelta: MMR_STAKE,
  },
  [DuelResult.Loss]: {
    title: 'Defeat',
    accent: 'text-live',
    icon: <Fire className="size-8" />,
    mmrDelta: -MMR_STAKE,
  },
  [DuelResult.Draw]: {
    title: 'Draw',
    accent: 'text-muted-foreground',
    icon: <Handshake className="size-8" />,
    mmrDelta: 0,
  },
};

function formatMmr(delta: number): string {
  if (delta > 0) return `+${delta} MMR`;
  if (delta < 0) return `${delta} MMR`;
  return '±0 MMR';
}

/**
 * Result overlay shown when `duel.store.finished` is true.
 * Actions: Rematch (resets store, stays on page) | Back to Duelists (resets + navigates).
 */
export function DuelResultDialog() {
  const finished = useDuelStore((s) => s.finished);
  const result = useDuelStore((s) => s.result);
  const selfScore = useDuelStore((s) => s.selfScore);
  const opponentScore = useDuelStore((s) => s.opponentScore);
  const opponent = useDuelStore((s) => s.opponent);
  const duelId = useDuelStore((s) => s.duelId);
  const start = useDuelStore((s) => s.start);
  const reset = useDuelStore((s) => s.reset);

  const meta = result !== null ? RESULT_CONFIG[result] : null;

  function handleRematch() {
    if (!opponent || !duelId) return;
    // Generate a fresh id so the store treats it as a new match.
    start(`${duelId}-r${Date.now()}`, opponent);
  }

  return (
    <Dialog open={finished} onOpenChange={(open) => { if (!open) reset(); }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <div className={`flex items-center gap-2.5 ${meta?.accent ?? 'text-foreground'}`}>
            {meta?.icon}
            <DialogTitle className={meta?.accent ?? ''}>
              {meta?.title ?? 'Match Over'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {selfProfile.name} vs {opponent?.name ?? 'Opponent'}
          </DialogDescription>
        </DialogHeader>

        {/* Final scoreline */}
        <div className="flex items-center justify-center gap-6 py-3">
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-heading text-display font-bold tabular-nums">{selfScore}</span>
            <span className="text-micro text-muted-foreground">{selfProfile.name}</span>
          </div>
          <span className="text-xl text-muted-foreground">–</span>
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-heading text-display font-bold tabular-nums">{opponentScore}</span>
            <span className="text-micro text-muted-foreground">{opponent?.name ?? 'Opponent'}</span>
          </div>
        </div>

        {/* MMR delta */}
        {meta && (
          <p className={`text-center text-sm font-semibold ${meta.accent}`}>
            {formatMmr(meta.mmrDelta)}
          </p>
        )}

        <DialogFooter className="mt-1 flex-col gap-2 sm:flex-col">
          <Button shape="pill" className="w-full" onClick={handleRematch}>
            Rematch
          </Button>
          <Button
            variant="outline"
            shape="pill"
            className="w-full"
            render={<Link href="/duelists" onClick={reset} />}
          >
            Back to Duelists
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
