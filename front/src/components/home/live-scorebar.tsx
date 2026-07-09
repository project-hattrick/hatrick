'use client';

import { useEffect, useRef, useState } from 'react';
import { MatchPicker } from './match-picker';
import { useDisplayMatch, useIsMatchLive, useIsReplay } from '@/store/match.store';
import { usePredictionPrompt } from '@/store/prediction.store';
import { usePlacePrediction } from '@/services/queries';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';
import { gameStateConfig, gameStateFallback } from '@/config/game-state.config';
import { lookup } from '@/lib/lookup';
import { formatMinute } from '@/lib/format';
import { cn } from '@/lib/utils';

// Navbar height (h-16). The sentinel exits under this line the moment the bar pins.
const NAV_OFFSET = 65;

function OddPill({ label, odds, onClick }: { label: string; odds: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs transition will-change-transform hover:-translate-y-px hover:border-neon active:translate-y-0 motion-reduce:hover:translate-y-0"
    >
      <span className="text-micro font-semibold tracking-wide text-muted-foreground">{label}</span>
      {odds.toFixed(2)}
    </button>
  );
}

/**
 * The live scoreboard as a seam element: it starts at the hero↔dashboard boundary and, being
 * position:sticky, pins under the navbar the instant scroll reaches it — then stays pinned all
 * the way down the dashboard. A 1px sentinel above it drives a drop shadow once it has pinned.
 */
export function LiveScorebar() {
  const match = useDisplayMatch();
  const isLive = useIsMatchLive();
  const isReplay = useIsReplay();
  const prompt = usePredictionPrompt();
  const placePrediction = usePlacePrediction();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: `-${NAV_OFFSET}px 0px 0px 0px`,
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const phase = lookup(gameStateConfig, match.gameState, gameStateFallback);
  const outcome =
    match.score.home === match.score.away
      ? 'Draw'
      : `${match.score.home > match.score.away ? match.home.code : match.away.code} win`;

  const onPick = (label: 'YES' | 'NO') => {
    if (!prompt) return;
    const points = label === 'YES' ? prompt.yesPoints : prompt.noPoints;
    placePrediction.mutate({
      fixtureId: MOCK_FIXTURE_ID,
      market: prompt.market,
      label: `${prompt.question} ${label}`,
      points,
    });
  };

  return (
    <>
      {/* Seam sentinel — its exit under the navbar means the bar has pinned. */}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      <div
        className={cn(
          'sticky top-16 z-20 border-y border-border bg-surface-1 transition-shadow duration-200 motion-reduce:transition-none',
          stuck ? 'shadow-e3' : 'shadow-none',
        )}
      >
        <div className="mx-auto flex h-[52px] w-full max-w-6xl items-center gap-3 px-4 md:gap-4 md:px-6">
          {isReplay ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-neon" />
              <span className="font-mono text-eyebrow text-neon">REPLAY</span>
            </span>
          ) : isLive ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-live motion-reduce:animate-none" />
              <span className="font-mono text-eyebrow text-live">LIVE</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-muted-foreground" />
              <span className="font-mono text-eyebrow text-muted-foreground">ENDED</span>
            </span>
          )}

          <MatchPicker />

          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
            {isReplay || isLive ? `${formatMinute(match.minute)} · ${phase.label}` : phase.label}
          </span>

          {isLive ? (
            /* Live market quick-bet — same action as the hero prediction dock. */
            prompt ? (
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden max-w-[240px] truncate text-xs text-muted-foreground lg:block">
                  {prompt.question}
                </span>
                <OddPill label="YES" odds={prompt.yesOdds} onClick={() => onPick('YES')} />
                <OddPill label="NO" odds={prompt.noOdds} onClick={() => onPick('NO')} />
              </div>
            ) : null
          ) : (
            /* Finished match — betting is closed, so the seam shows the settled result instead. */
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">Full-time result</span>
              <span className="inline-flex items-center rounded-md border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs font-semibold">
                {outcome}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
