'use client';

import { use, useEffect } from 'react';
import { DuelArena } from '@/components/duel/duel-arena';
import { DuelSetup } from '@/components/duel/duel-setup';
import { useDuelStore } from '@/store/duel.store';
import { useDuelDetail } from '@/services/queries/use-duel-detail';
import { WireBlock } from '@/components/common/wire-block';
import { useAuthStore } from '@/store/auth.store';
import { backendEnabled } from '@/services/session-mode';

interface DuelPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 1v1 Duel Arena page — full-bleed, engine-driven.
 *
 * Two entry modes:
 * - Persona/CPU duel: store already seeded by ChallengeMount (inSetup=true, role=null).
 * - PvP server duel: store seeded by startServerDuel via the duel:ready socket event
 *   before navigation lands here (inSetup=false, role='host'|'guest').
 *
 * Direct-visit guard: if a cuid-shaped URL id is visited without the store being seeded
 * (e.g. page refresh), fetch the detail and re-seed. The auth user id determines role.
 */
export default function DuelPage({ params }: DuelPageProps) {
  const { id } = use(params);
  const inSetup = useDuelStore((s) => s.inSetup);
  const opponent = useDuelStore((s) => s.opponent);
  const serverId = useDuelStore((s) => s.serverId);
  const role = useDuelStore((s) => s.role);
  const startServerDuel = useDuelStore((s) => s.startServerDuel);
  const authUser = useAuthStore((s) => s.user);

  // A cuid starts with 'c' and is ~25 chars; persona ids are short usernames like 'bleuforce'.
  const looksLikeServerId = backendEnabled && /^c[a-z0-9]{20,}$/.test(id ?? '');
  const needsSeed = looksLikeServerId && serverId !== id;

  const { data: detail, isLoading } = useDuelDetail(needsSeed ? id : null);

  // When the detail arrives, re-seed the store (handles direct-visit / page-refresh case).
  useEffect(() => {
    if (!detail || !needsSeed || !authUser) return;
    const detectedRole = detail.host.id === authUser.id ? 'host' : 'guest';
    startServerDuel(detail, detectedRole);
  }, [detail, needsSeed, authUser, startServerDuel]);

  if (needsSeed && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <WireBlock label="Loading match…" className="h-40 w-[320px]" />
      </div>
    );
  }

  // Pre-match step: lock your XI/formation (persona/CPU duels only — role is null).
  if (inSetup && opponent && !role) return <DuelSetup />;

  // Full-bleed engine + identity overlay; renders a fallback when no opponent is set.
  return <DuelArena />;
}
