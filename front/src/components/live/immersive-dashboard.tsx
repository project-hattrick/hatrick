import { Scoreboard } from './scoreboard';
import { PlayerFocusCard } from './player-focus-card';
import { MyPredictionsPanel } from './my-predictions-panel';
import { HeroCenterDock } from './hero-center-dock';
import { HeroQuickActions } from './hero-quick-actions';
import { MatchTimeline } from './match-timeline';
import { CrowdPanel } from '@/components/crowd/crowd-panel';
import { UserCardsStrip } from '@/components/fantasy/user-cards-strip';
import { PoweredByTxline } from '@/components/common/powered-by-txline';
import { HeroChrome } from './hero-chrome';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';

/** Wire 3a — glass widgets pinned near the screen edges over the live match stage. */
export function ImmersiveDashboard() {
  return (
    <div className="relative mx-auto h-full min-h-0 w-full overflow-hidden">
      <HeroChrome>
      {/* Data-provider credit — top-left chip on desktop; on mobile it moves to the bottom row so it
          never overlaps the centred scoreboard/match switcher. */}
      <div className="absolute left-4 top-[calc(env(safe-area-inset-top)+4.25rem)] z-10 hidden md:left-6 md:top-20 md:block">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-overlay/55 px-3 py-1.5 backdrop-blur-md">
          <PoweredByTxline tone="hero" className="pointer-events-auto" />
        </span>
      </div>

      {/* Scoreboard — top-centre, cleared below the navbar + notch on mobile. */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+4.25rem)] left-1/2 z-10 -translate-x-1/2 md:top-16">
        <Scoreboard />
      </div>

      {/* Player focus + my predictions — desktop rail only (keeps the mobile hero uncluttered). */}
      <div className="hidden md:absolute md:bottom-24 md:left-6 md:block md:w-[300px]">
        <PlayerFocusCard />
        <div className="mt-3">
          <MyPredictionsPanel />
        </div>
      </div>

      {/* Live prediction — the hero CTA; bottom-centre, above the quick actions + timeline. */}
      <div className="absolute inset-x-3 bottom-[7.5rem] z-20 flex justify-center sm:inset-x-4 md:inset-x-auto md:bottom-24 md:left-1/2 md:-translate-x-1/2">
        <HeroCenterDock />
      </div>

      {/* Mobile-only row above the replay bar: quick actions (chat / predictions / on the ball)
          plus the data-provider credit tucked bottom-right. */}
      <div className="absolute inset-x-3 bottom-[4.25rem] z-30 flex items-center justify-between gap-2 md:hidden">
        <HeroQuickActions />
        <span className="inline-flex items-center rounded-full border border-white/15 bg-overlay/55 px-2.5 py-1 backdrop-blur-md">
          <PoweredByTxline tone="hero" className="pointer-events-auto" />
        </span>
      </div>

      {/* Cards + crowd — desktop rail only; anchored low so the crowd sits near the bottom. */}
      <div className="hidden md:absolute md:top-20 md:right-6 md:bottom-24 md:flex md:w-[334px] md:flex-col md:justify-end md:gap-3">
        <UserCardsStrip />
        <CrowdPanel fixtureId={MOCK_FIXTURE_ID} />
      </div>

      {/* The single playback surface — transport + event timeline + view toggles. */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3 md:px-6 md:pb-4">
        <MatchTimeline />
      </div>
      </HeroChrome>
    </div>
  );
}
