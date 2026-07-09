import { Scoreboard } from './scoreboard';
import { PlayerFocusCard } from './player-focus-card';
import { HeroCenterDock } from './hero-center-dock';
import { ReplayBadge } from './replay-badge';
import { MatchTimeline } from './match-timeline';
import { MatchBackground } from './match-background';
import { MatchSelector } from './match-selector';
import { CrowdPanel } from '@/components/crowd/crowd-panel';
import { UserCardsStrip } from '@/components/fantasy/user-cards-strip';
import { HeroChrome } from './hero-chrome';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';

/** Wire 3b — framed live match on the left (prediction docked over the pitch), game switcher + cards + crowd on the right. */
export function SplitDashboard() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 bg-background px-4 pt-20 md:flex-row md:overflow-hidden md:pt-[72px]">
      <div className="relative min-h-[52vh] flex-1 overflow-hidden rounded-2xl border border-white/10 md:min-h-0">
        <MatchBackground scrim={false} />
        <HeroChrome>
          <div className="absolute top-4 left-4 z-10">
            <ReplayBadge />
          </div>
          <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
            <Scoreboard />
          </div>
          <div className="absolute top-4 right-4 z-10 hidden w-[240px] max-w-[calc(100%-2rem)] lg:block">
            <PlayerFocusCard />
          </div>
          <div className="absolute inset-x-4 bottom-20 z-20 flex justify-center md:inset-x-auto md:left-1/2 md:-translate-x-1/2">
            <HeroCenterDock />
          </div>
          <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3">
            <MatchTimeline />
          </div>
        </HeroChrome>
      </div>

      <div className="flex w-full flex-col gap-3 md:w-[392px]">
        <MatchSelector />
        <UserCardsStrip />
        <div className="min-h-[40vh] flex-1 md:min-h-0">
          <CrowdPanel fixtureId={MOCK_FIXTURE_ID} />
        </div>
      </div>
    </div>
  );
}
