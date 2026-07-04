'use client';

import { useEffect, useState } from 'react';
import { CaretDown } from '@/components/common/icons';
import { Flag } from '@/components/common/flag';
import { useMatch } from '@/store/match.store';
import { usePredictionPrompt } from '@/store/prediction.store';
import { usePlacePrediction } from '@/services/queries';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';
import { fifaToIso } from '@/lib/country';
import { formatMinute } from '@/lib/format';
import { cn } from '@/lib/utils';

// Reveal thresholds as a fraction of the viewport height. The curtain (HomeDashboard)
// fully covers the hero at ~1 viewport of scroll, so we snap the ticker in near there
// and keep hysteresis so it doesn't flicker at the boundary.
const REVEAL_AT = 0.9;
const HIDE_AT = 0.78;

/** Reveals once the hero has been curtained away, so the live match persists as chrome. */
function useRevealOnScroll(): boolean {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const p = window.scrollY / (window.innerHeight || 1);
      setRevealed((on) => (on ? p > HIDE_AT : p > REVEAL_AT));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    read();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return revealed;
}

function OddPill({ label, odds, onClick }: { label: string; odds: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs transition will-change-transform hover:-translate-y-px hover:border-neon active:translate-y-0 motion-reduce:hover:translate-y-0"
    >
      <span className="text-[10px] font-semibold tracking-wide text-muted-foreground">{label}</span>
      {odds.toFixed(2)}
    </button>
  );
}

/** Slim sportsbook ticker pinned below the navbar — the live match, always in reach. */
export function LiveTicker() {
  const revealed = useRevealOnScroll();
  const match = useMatch();
  const prompt = usePredictionPrompt();
  const placePrediction = usePlacePrediction();

  if (!match) return null;

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

  const scrollToHero = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div
      aria-hidden={!revealed}
      className={cn(
        'fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4rem)] z-20 border-b border-border bg-surface-1 transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none',
        revealed ? 'translate-y-0' : 'pointer-events-none -translate-y-[130%]',
      )}
    >
      <div className="mx-auto flex h-11 w-full max-w-6xl items-center gap-3 px-4 md:gap-4 md:px-6">
        {/* Live match — click to re-expand the cinematic hero. */}
        <button
          type="button"
          onClick={scrollToHero}
          className="group flex min-w-0 items-center gap-3 text-left"
          aria-label="Back to the live match"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-live motion-reduce:animate-none" />
            <span className="font-mono text-eyebrow text-live">LIVE {formatMinute(match.minute)}</span>
          </span>
          <span className="flex items-center gap-2 font-mono text-sm font-bold">
            <Flag code={fifaToIso(match.home.code)} className="text-base" />
            <span className="hidden sm:inline">{match.home.code}</span>
            <span className="tabular-nums">
              {match.score.home}
              <span className="mx-1 text-muted-foreground">–</span>
              {match.score.away}
            </span>
            <span className="hidden sm:inline">{match.away.code}</span>
            <Flag code={fifaToIso(match.away.code)} className="text-base" />
          </span>
          <CaretDown className="hidden size-3.5 rotate-180 text-muted-foreground transition group-hover:text-foreground md:block" />
        </button>

        {/* Live market quick-bet — placing here is the same action as the hero dock. */}
        {prompt ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden max-w-[240px] truncate text-xs text-muted-foreground lg:block">
              {prompt.question}
            </span>
            <OddPill label="YES" odds={prompt.yesOdds} onClick={() => onPick('YES')} />
            <OddPill label="NO" odds={prompt.noOdds} onClick={() => onPick('NO')} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
