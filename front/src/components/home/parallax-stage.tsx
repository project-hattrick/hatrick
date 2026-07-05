import { MatchBackground } from '@/components/live/match-background';

/** Match stage behind the hero; absolute so it scrolls away with the hero (no curtain). */
export function ParallaxStage() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* bridgeHud: only the hero backdrop feeds the store, so cinematic beats hide the hero chrome. */}
      <MatchBackground bridgeHud />
    </div>
  );
}
