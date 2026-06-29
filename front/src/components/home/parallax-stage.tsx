import { MatchBackground } from '@/components/live/match-background';

/** Fullscreen stage that shrinks into a fixed top-right mini-player as you scroll. */
export function ParallaxStage() {
  return (
    <div className="pip-stage fixed top-0 left-0 z-0 h-screen w-screen overflow-hidden will-change-[top,left,width,height]">
      <MatchBackground />
    </div>
  );
}
