import { Scoreboard } from './scoreboard';
import { PlaybackControls } from './playback-controls';
import { PlayerFocusCard } from './player-focus-card';
import { MyPredictionsPanel } from './my-predictions-panel';
import { PredictionPrompt } from './prediction-prompt';
import { CrowdPanel } from '@/components/crowd/crowd-panel';
import { UserCardsStrip } from '@/components/fantasy/user-cards-strip';
import { HeroChrome } from './hero-chrome';
import { ScrollCue } from './scroll-cue';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';

/** Wire 3a — glass widgets pinned near the screen edges over the live match stage; sits just under
 *  full height so the live scoreboard peeks below the fold as a scroll affordance. */
export function ImmersiveDashboard() {
  return (
    <div className="relative mx-auto h-[82svh] min-h-[480px] w-full overflow-hidden">
      <HeroChrome>
      {/* Scoreboard — top-centre, cleared below the navbar + notch on mobile. */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+4.25rem)] left-1/2 z-10 -translate-x-1/2 md:top-16">
        <Scoreboard />
      </div>

      {/* Playback controls — desktop rail only. */}
      <div className="hidden md:absolute md:top-20 md:left-6 md:block">
        <PlaybackControls />
      </div>

      {/* Player focus + my predictions — desktop rail only (keeps the mobile hero uncluttered). */}
      <div className="hidden md:absolute md:bottom-6 md:left-6 md:block md:w-[300px]">
        <PlayerFocusCard />
        <div className="mt-3">
          <MyPredictionsPanel />
        </div>
      </div>

      {/* Live prediction — the hero CTA; bottom-centre on every size, above the home indicator. */}
      <div className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-20 flex justify-center sm:inset-x-4 md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2">
        <PredictionPrompt />
      </div>

      {/* Cards + crowd — desktop rail only. */}
      <div className="hidden md:absolute md:top-20 md:right-6 md:bottom-6 md:flex md:w-[334px] md:flex-col md:gap-3">
        <UserCardsStrip />
        <div className="min-h-0 flex-1">
          <CrowdPanel fixtureId={MOCK_FIXTURE_ID} />
        </div>
      </div>
      </HeroChrome>
      <ScrollCue />
    </div>
  );
}
