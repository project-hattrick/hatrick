import { Scoreboard } from './scoreboard';
import { PlaybackControls } from './playback-controls';
import { PlayerFocusCard } from './player-focus-card';
import { PredictionPrompt } from './prediction-prompt';
import { MatchBackground } from './match-background';
import { CrowdPanel } from '@/components/crowd/crowd-panel';
import { UserCardsStrip } from '@/components/fantasy/user-cards-strip';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';

/** Wire 3b — framed live match on the left, prediction/cards/crowd column on the right. */
export function SplitDashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col gap-4 bg-background px-4 pt-20 pb-4 md:h-screen md:flex-row md:overflow-hidden md:pt-[72px]">
      <div className="relative min-h-[52vh] flex-1 overflow-hidden rounded-2xl border border-white/10 md:min-h-0">
        <MatchBackground scrim={false} />
        <div className="absolute top-4 left-4 z-10">
          <PlaybackControls />
        </div>
        <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
          <Scoreboard />
        </div>
        <div className="absolute bottom-4 left-4 z-10 w-[260px] max-w-[calc(100%-2rem)]">
          <PlayerFocusCard />
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 md:w-[392px]">
        <PredictionPrompt variant="card" />
        <UserCardsStrip />
        <div className="min-h-[40vh] flex-1 md:min-h-0">
          <CrowdPanel fixtureId={MOCK_FIXTURE_ID} />
        </div>
      </div>
    </div>
  );
}
