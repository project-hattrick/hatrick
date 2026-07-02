import { Scoreboard } from './scoreboard';
import { PlaybackControls } from './playback-controls';
import { PlayerFocusCard } from './player-focus-card';
import { MyPredictionsPanel } from './my-predictions-panel';
import { PredictionPrompt } from './prediction-prompt';
import { CrowdPanel } from '@/components/crowd/crowd-panel';
import { UserCardsStrip } from '@/components/fantasy/user-cards-strip';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';

/** Wire 3a — glass widgets pinned near the screen edges over the live match stage, capped to 100vh. */
export function ImmersiveDashboard() {
  return (
    <div className="relative mx-auto h-[100svh] min-h-[600px] w-full overflow-hidden">
      <div className="absolute top-16 left-1/2 z-10 -translate-x-1/2 sm:top-18 md:top-16">
        <Scoreboard />
      </div>

      <div className="hidden md:absolute md:top-20 md:left-6 md:block">
        <PlaybackControls />
      </div>

      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+174px)] left-3 z-10 w-[220px] sm:bottom-[calc(env(safe-area-inset-bottom)+190px)] sm:left-4 md:bottom-6 md:left-6 md:w-[300px]">
        <PlayerFocusCard />
        <div className="hidden md:mt-3 md:block">
          <MyPredictionsPanel />
        </div>
      </div>

      <div className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-20 flex justify-center sm:inset-x-4 md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2">
        <PredictionPrompt />
      </div>

      <div className="hidden flex-col gap-3 md:absolute md:top-20 md:right-6 md:bottom-6 md:flex md:w-[334px]">
        <UserCardsStrip />
        <div className="min-h-0 flex-1">
          <CrowdPanel fixtureId={MOCK_FIXTURE_ID} />
        </div>
      </div>
    </div>
  );
}
