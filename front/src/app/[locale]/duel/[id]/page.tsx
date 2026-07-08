'use client';

import { DuelArena } from '@/components/duel/duel-arena';
import { DuelSetup } from '@/components/duel/duel-setup';
import { useDuelStore } from '@/store/duel.store';

/**
 * 1v1 Duel Arena page — full-bleed, engine-driven. The match runs continuously like the real-GK
 * sandbox (no forced settlement). Direct-visit safety: DuelArena renders a graceful fallback when
 * opponent is null. Metadata lives in the sibling layout.tsx (server component, noindex).
 */
export default function DuelPage() {
  const inSetup = useDuelStore((s) => s.inSetup);
  const opponent = useDuelStore((s) => s.opponent);

  // Pre-match step: lock your XI/formation before the engine spins up.
  if (inSetup && opponent) return <DuelSetup />;

  // Full-bleed engine + identity overlay; renders a fallback when no opponent is set.
  return <DuelArena />;
}
