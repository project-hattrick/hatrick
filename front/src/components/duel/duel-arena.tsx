'use client';

import Link from 'next/link';
import { GameStage } from '@/components/game/game-stage';
import { GlassPanel } from '@/components/common/glass-panel';
import { Button } from '@/components/ui/button';
import { SoccerBall } from '@/components/common/icons';
import { CheckpointId } from '@/game/checkpoints/registry';
import { useDuelStore } from '@/store/duel.store';
import { DuelHud } from './duel-hud';

/** Graceful empty state when no duel is active in the store. */
function NoDuelFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <GlassPanel className="flex max-w-sm flex-col items-center gap-4 p-8 text-center">
        <SoccerBall className="size-12 text-muted-foreground" />
        <p className="font-heading text-title font-semibold">No active duel</p>
        <p className="text-sm text-muted-foreground">
          Pick an opponent from the Duelists directory to start a 1v1 match.
        </p>
        <Button render={<Link href="/duelists" />} shape="pill" className="mt-1">
          Browse Duelists
        </Button>
      </GlassPanel>
    </div>
  );
}

/**
 * Full-bleed 1v1 arena.
 * - Renders the real 2D engine via GameStage (checkpoint ArenaV1).
 * - Overlays DuelHud (player identity chips, z-20, pointer-events-none).
 * - Falls back gracefully when no opponent is set in duel.store.
 */
export function DuelArena() {
  const opponent = useDuelStore((s) => s.opponent);

  if (!opponent) return <NoDuelFallback />;

  return (
    <>
      <GameStage checkpoint={CheckpointId.ArenaV1} />
      <DuelHud />
    </>
  );
}
