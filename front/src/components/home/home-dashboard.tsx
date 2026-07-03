import * as React from 'react';
import { ModeFeatureCard } from './widgets/mode-feature-card';
import { PackCard } from './widgets/pack-card';
import { StepCard } from './widgets/step-card';
import { SectionLink } from './widgets/section-link';
import { MobileCta } from './widgets/mobile-cta';
import { SquadSection } from './squad-section';
import { MatchDashboard } from './dashboard/match-dashboard';
import { featuredPacks, howItWorksSteps, playModes } from '@/config/home.config';

function RowHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-bold tracking-wider uppercase">{title}</h2>
      {action}
    </div>
  );
}

/** The whole below-hero experience as one continuous dashboard (the footer stays separate). */
export function HomeDashboard() {
  return (
    <div className="relative z-10">
      <div aria-hidden className="curtain-seam h-24 bg-gradient-to-b from-transparent to-background md:h-32" />
      <div className="bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pt-4 pb-10 md:pt-6 md:pb-14">
        <MatchDashboard />

        <SquadSection />

        <div className="grid gap-4 md:grid-cols-2">
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
