import { MatchBackground } from '@/components/live/match-background';

/** Fullscreen match stage fixed behind the hero; the dashboard rises over it on scroll. */
export function ParallaxStage() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <MatchBackground />
    </div>
  );
}
