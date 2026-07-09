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

/** Split duel: framed pitch on the left (scoreboard + on-the-ball + prediction docked), decks + chat on the right. */
export function DuelSplit({ onEngineReady }: { onEngineReady?: (handle: RealGkHandle | null) => void }) {
  const opponent = useDuelStore((s) => s.opponent);
  const selfDeck = useSelfDeck();
  const { displayName } = useSelfIdentity();

  return (
    <div className="flex min-h-screen w-full flex-col gap-4 bg-background p-4 md:h-screen md:flex-row md:overflow-hidden">
      <div className="relative min-h-[52vh] flex-1 overflow-hidden rounded-2xl border border-border md:min-h-0">
        <RealGkBackground bridgeHud config={DUEL_ARENA_CONFIG} onReady={onEngineReady} />
        <HeroChrome>
          <div className="absolute top-4 left-4 z-10">
            <DuelLayoutToggle />
          </div>
          <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
            <DuelScoreboard />
          </div>
          <div className="absolute top-24 right-4 z-10 hidden w-[240px] max-w-[calc(100%-2rem)] lg:block">
            <PlayerFocusCard />
          </div>
          <div className="absolute inset-x-4 bottom-4 z-20 flex justify-center md:inset-x-auto md:left-1/2 md:-translate-x-1/2">
            <PredictionPrompt />
          </div>
        </HeroChrome>
      </div>

      <div className="flex w-full flex-col gap-3 md:h-full md:w-[392px]">
        <div className="flex gap-3">
          <DuelDeckRail title={displayName} cards={selfDeck} className="max-h-[38vh] flex-1" />
          {opponent && (
            <DuelDeckRail title={opponent.name} cards={OPPONENT_DECK} className="max-h-[38vh] flex-1" />
          )}
        </div>
        <div className="min-h-[40vh] flex-1 md:min-h-0">
          <CrowdPanel fixtureId={MOCK_FIXTURE_ID} />
        </div>
      </div>
    </div>
  );
}
