import * as React from 'react';
import { LiveNowCard } from './widgets/live-now-card';
import { UpcomingSummaryCard } from './widgets/upcoming-summary-card';
import { TopLeaguesCard } from './widgets/top-leagues-card';
import { PointsCard } from './widgets/points-card';
import { UpcomingMatchesCard } from './widgets/upcoming-matches-card';
import { CollectionCard } from './widgets/collection-card';
import { TopPlayersCard } from './widgets/top-players-card';
import { ModeFeatureCard } from './widgets/mode-feature-card';
import { PackCard } from './widgets/pack-card';
import { StepCard } from './widgets/step-card';
import { SectionLink } from './widgets/section-link';
import { MobileCta } from './widgets/mobile-cta';
import { SquadSection } from './squad-section';
import { featuredPacks, howItWorksSteps, playModes } from '@/config/home.config';

function RowHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="h-4 w-1 rounded-full bg-neon" />
        <h2 className="text-sm font-bold tracking-wider uppercase">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** The whole below-hero experience as one continuous dashboard (the footer stays separate). */
export function HomeDashboard() {
  return (
    <div className="relative z-10">
      <div aria-hidden className="h-24 bg-gradient-to-b from-transparent to-background md:h-32" />
      <div className="bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pt-4 pb-10 md:pt-6 md:pb-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <LiveNowCard />
          <UpcomingSummaryCard />
          <TopLeaguesCard />
          <PointsCard />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr_1fr]">
          <UpcomingMatchesCard />
          <CollectionCard />
          <TopPlayersCard />
        </div>

        <SquadSection />

        <div className="grid gap-4 md:grid-cols-3">
          {playModes.map((mode) => (
            <ModeFeatureCard key={mode.key} mode={mode} />
          ))}
        </div>

        <div>
          <RowHeader title="Featured packs" action={<SectionLink href="/store" label="View all packs" />} />
          <div className="grid gap-4 md:grid-cols-3">
            {featuredPacks.map((pack) => (
              <PackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </div>

        <div>
          <RowHeader title="How it works" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorksSteps.map((step) => (
              <StepCard key={step.step} data={step} />
            ))}
          </div>
        </div>

        <MobileCta />
        </div>
      </div>
    </div>
  );
}
