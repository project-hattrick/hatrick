'use client';

import { useLiveFeed } from '@/services/realtime/use-live-feed';
import { Scoreboard } from './scoreboard';
import { EventTicker } from './event-ticker';
import { PlaybackControls } from './playback-controls';
import { MyPredictionsPanel } from './my-predictions-panel';
import { PredictionPrompt } from './prediction-prompt';
import { CrowdPanel } from '@/components/crowd/crowd-panel';
import { UserCardsStrip } from '@/components/fantasy/user-cards-strip';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';

/** First viewport: live widgets centered on a max width, over the fullscreen stage. */
export function LiveDashboard() {
  useLiveFeed();

  return (
    <section className="relative min-h-screen w-full">
      <div className="relative mx-auto flex min-h-screen w-full flex-col gap-3 px-6 pt-20 pb-10 md:block md:w-[92%] md:p-0">
        <div className="flex flex-col items-center gap-2 md:absolute md:top-20 md:left-1/2 md:-translate-x-1/2">
          <Scoreboard />
          <EventTicker />
        </div>

        <div className="hidden md:absolute md:top-20 md:left-6 md:block">
          <PlaybackControls />
        </div>

        <div className="md:absolute md:bottom-6 md:left-6 md:w-80">
          <MyPredictionsPanel />
        </div>

        <div className="flex justify-center md:absolute md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:block">
          <PredictionPrompt />
        </div>

        <div className="flex flex-col gap-3 md:absolute md:top-20 md:right-6 md:bottom-6 md:w-[320px]">
          <UserCardsStrip />
          <div className="h-[55vh] min-h-0 md:h-auto md:flex-1">
            <CrowdPanel fixtureId={MOCK_FIXTURE_ID} />
          </div>
        </div>
      </div>
    </section>
  );
}
