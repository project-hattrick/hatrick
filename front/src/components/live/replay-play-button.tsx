'use client';

import { Play, ClockCounterClockwise } from '@/components/common/icons';
import { useIsMatchLive } from '@/store/match.store';
import { useHeroControls } from '@/store/hero-engine.store';
import { useUiStore } from '@/store/ui.store';

/**
 * Center replay control over the pitch. You can't bet on a finished match, so the hero centre offers
 * a Replay: it restarts the personas sim from kickoff (with the intro). Hidden while a match is live
 * and playing; shows as a Play when paused.
 */
export function ReplayPlayButton() {
  const isLive = useIsMatchLive();
  const controls = useHeroControls();
  const playing = useUiStore((state) => state.playing);
  const togglePlaying = useUiStore((state) => state.togglePlaying);

  // Live + playing → the bet dock owns the centre; nothing to show here.
  if (isLive && playing) return null;

  const isReplay = !isLive;
  const onClick = () => {
    if (isReplay) controls?.restart();
    if (!playing) togglePlaying();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isReplay ? 'Replay match' : 'Play'}
      className="pointer-events-auto group flex flex-col items-center gap-2"
    >
      <span className="grid size-20 place-items-center rounded-full border border-white/15 bg-overlay/55 text-foreground backdrop-blur-md transition group-hover:scale-105 group-hover:border-neon group-hover:text-neon">
        {isReplay ? <ClockCounterClockwise className="size-9" /> : <Play className="size-9 translate-x-0.5" />}
      </span>
      <span className="font-mono text-eyebrow font-bold tracking-wide text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
        {isReplay ? 'WATCH REPLAY' : 'PLAY'}
      </span>
    </button>
  );
}
