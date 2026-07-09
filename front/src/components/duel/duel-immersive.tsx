import { RealGkBackground } from '@/components/game/real-gk/real-gk-background';
import { CrowdPanel } from '@/components/crowd/crowd-panel';
import { PlayerFocusCard } from '@/components/live/player-focus-card';
import { PredictionPrompt } from '@/components/live/prediction-prompt';
import { HeroChrome } from '@/components/live/hero-chrome';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';
import { DUEL_ARENA_CONFIG, OPPONENT_DECK } from '@/config/duel-match.config';
import type { RealGkHandle } from '@/game/realgk/types';
import { useSelfDeck } from '@/hooks/use-self-deck';
import { useSelfIdentity } from '@/hooks/use-self-identity';
import { useDuelStore } from '@/store/duel.store';
import { DuelScoreboard } from './duel-scoreboard';
import { DuelDeckRail } from './duel-deck-rail';
import { DuelLayoutToggle } from './duel-layout-toggle';

/** Immersive duel: full-bleed real-match engine with personalized glass widgets pinned to the screen edges. */
export function DuelImmersive({ onEngineReady }: { onEngineReady?: (handle: RealGkHandle | null) => void }) {
  const opponent = useDuelStore((s) => s.opponent);
  const selfDeck = useSelfDeck();
  const { displayName } = useSelfIdentity();

  return (
    <div className="relative mx-auto h-[100svh] min-h-[520px] w-full overflow-hidden">
      {/* Real Match GK engine (duel variant: match structure + driven filler) — the duel director drives it. */}
      <RealGkBackground bridgeHud config={DUEL_ARENA_CONFIG} onReady={onEngineReady} />
      <HeroChrome>
        {/* Scoreboard — top-centre (avatars, not flags), just clear of the notch. */}
        <div className="absolute top-[calc(env(safe-area-inset-top)+1rem)] left-1/2 z-10 -translate-x-1/2 md:top-6">
          <DuelScoreboard />
        </div>

        {/* Layout toggle — desktop rail only. */}
        <div className="pointer-events-none hidden md:absolute md:top-6 md:left-6 md:block">
          <DuelLayoutToggle />
        </div>

        {/* Self deck — extreme left, vertical. */}
        <div className="hidden md:absolute md:top-24 md:bottom-6 md:left-3 md:flex md:w-[116px]">
          <DuelDeckRail title={displayName} cards={selfDeck} className="w-full" />
        </div>

        {/* Opponent deck — extreme right, vertical. */}
        {opponent && (
          <div className="hidden md:absolute md:top-24 md:right-3 md:bottom-6 md:flex md:w-[116px]">
            <DuelDeckRail title={opponent.name} cards={OPPONENT_DECK} className="w-full" />
          </div>
        )}

        {/* On the ball + predictions — bottom-left, inset past the self deck (lg+ only; at md the
            300px card would overlap the 320px crowd on a tablet, so both wait for lg). */}
        <div className="hidden lg:absolute lg:bottom-6 lg:left-[140px] lg:block lg:w-[300px]">
          <PlayerFocusCard />
        </div>

        {/* Crowd chat — right, inset past the opponent deck (lg+ only, see above). */}
        <div className="hidden lg:absolute lg:top-24 lg:right-[140px] lg:bottom-6 lg:flex lg:w-[320px]">
          <CrowdPanel fixtureId={MOCK_FIXTURE_ID} />
        </div>

        {/* Prediction CTA — bottom-centre on every size. */}
        <div className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-20 flex justify-center sm:inset-x-4 md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2">
          <PredictionPrompt />
        </div>
      </HeroChrome>
    </div>
  );
}
