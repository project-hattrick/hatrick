'use client';

import { headToHead } from '@/config/profile-mock';
import { realHeadToHead } from '@/lib/head-to-head';
import { useDuels } from '@/services/queries/use-duels';
import { isBackendSession } from '@/services/session-mode';
import type { PlayerProfile } from '@/config/duelists.config';

/** Mini head-to-head panel: your record vs this player, with a share bar. */
export function HeadToHeadCard({ profile }: { profile: PlayerProfile }) {
  const { data: duels } = useDuels();
  // Backend session → the REAL duel record vs this opponent (0×0 when none);
  // mock mode keeps the deterministic demo record.
  const { mine, theirs } = isBackendSession()
    ? realHeadToHead(duels ?? [], profile)
    : headToHead(profile);
  const pct = Math.round((mine / (mine + theirs || 1)) * 100);
  const them = profile.name.split(' ')[0];

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface-1/70 p-4">
      <div className="text-eyebrow mb-3 text-muted-foreground">Head-to-head</div>
      <div className="flex items-center gap-3">
        <div className="flex-1 text-center">
          <div className="font-mono text-2xl font-bold text-neon tabular-nums">{mine}</div>
          <div className="text-micro text-muted-foreground">You</div>
        </div>
        <span className="font-mono text-xs text-muted-foreground">×</span>
        <div className="flex-1 text-center">
          <div className="font-mono text-2xl font-bold tabular-nums">{theirs}</div>
          <div className="text-micro truncate text-muted-foreground">{them}</div>
        </div>
      </div>
      <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="bg-neon" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
