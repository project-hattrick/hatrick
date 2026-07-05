import { RealGkBackground } from '@/components/game/real-gk/real-gk-background';
import { CrowdPanel } from '@/components/crowd/crowd-panel';
import { PlayerFocusCard } from '@/components/live/player-focus-card';
import { PredictionPrompt } from '@/components/live/prediction-prompt';
import { HeroChrome } from '@/components/live/hero-chrome';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';
import { selfProfile } from '@/config/duelists.config';
import { userCards } from '@/config/fantasy-cards.config';
import { useDuelStore } from '@/store/duel.store';
import { DuelScoreboard } from './duel-scoreboard';
import { DuelDeckRail } from './duel-deck-rail';
import { DuelLayoutToggle } from './duel-layout-toggle';

const OPPONENT_DECK = [...userCards].reverse();

/** Immersive duel: full-bleed real-match engine with personalized glass widgets pinned to the screen edges. */
export function DuelImmersive() {
  const opponent = useDuelStore((s) => s.opponent);

  return (
    <div className="relative mx-auto h-[100svh] min-h-[520px] w-full overflow-hidden">
      {/* Real Match GK engine (hero parity) — auto-plays, bridges its HUD so the scoreboard reads the live score. */}
      <RealGkBackground bridgeHud />
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
          <DuelDeckRail title={selfProfile.name} cards={userCards} className="w-full" />
        </div>

        {/* Opponent deck — extreme right, vertical. */}
        {opponent && (
          <div className="hidden md:absolute md:top-24 md:right-3 md:bottom-6 md:flex md:w-[116px]">
            <DuelDeckRail title={opponent.name} cards={OPPONENT_DECK} className="w-full" />
          </div>
        )}

        {/* On the ball + predictions — bottom-left, inset past the self deck. */}
        <div className="hidden md:absolute md:bottom-6 md:left-[140px] md:block md:w-[300px]">
          <PlayerFocusCard />
        </div>

        {/* Crowd chat — right, inset past the opponent deck. */}
        <div className="hidden md:absolute md:top-24 md:right-[140px] md:bottom-6 md:flex md:w-[320px]">
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
