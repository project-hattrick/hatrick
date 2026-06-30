'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { LiveBadge } from '@/components/common/live-badge';
import { useMatch } from '@/store/match.store';
import { formatScore } from '@/lib/format';

/** Compact live-match summary that docks at the top once the hero is covered (Globo-style mini-player). */
export function MiniMatchSummary() {
  const match = useMatch();
  if (!match) return null;

  return (
    <div className="mini-summary pointer-events-none fixed inset-x-0 top-20 z-20 flex justify-center px-6 opacity-0">
      <GlassPanel radius="pill" tone="blur" className="flex items-center gap-3 px-4 py-1.5">
        <LiveBadge minute={match.minute} className="text-xs" />
        <span className="h-4 w-px bg-border" aria-hidden />
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="text-base leading-none" aria-hidden>{match.home.flag}</span>
          {match.home.code}
        </span>
        <span className="text-sm font-bold tabular-nums text-neon">
          {formatScore(match.score.home, match.score.away)}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {match.away.code}
          <span className="text-base leading-none" aria-hidden>{match.away.flag}</span>
        </span>
      </GlassPanel>
    </div>
  );
}
