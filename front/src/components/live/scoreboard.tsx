'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { LiveBadge } from '@/components/common/live-badge';
import { TeamCrest } from '@/components/common/team-crest';
import { useMatch } from '@/store/match.store';
import { gameStateConfig, gameStateFallback } from '@/config/game-state.config';
import { lookup } from '@/lib/lookup';

/** Top-center score pill driven by the match store. */
export function Scoreboard() {
  const match = useMatch();
  if (!match) return null;

  const phase = lookup(gameStateConfig, match.gameState, gameStateFallback);

  return (
    <GlassPanel radius="pill" className="flex items-center gap-5 px-6 py-2.5 md:gap-8 md:px-8">
      <LiveBadge minute={match.minute} className="hidden w-20 md:inline-flex" />
      <TeamCrest code={match.home.code} flag={match.home.flag} className="w-12" />
      <div className="flex items-center gap-4 text-3xl font-bold tracking-widest">
        {match.score.home}
        <span className="-mt-1 text-2xl text-muted-foreground">-</span>
        {match.score.away}
      </div>
      <TeamCrest code={match.away.code} flag={match.away.flag} className="w-12" />
      <span className="hidden w-20 text-right text-sm font-bold text-neon md:block">{phase.label}</span>
    </GlassPanel>
  );
}
