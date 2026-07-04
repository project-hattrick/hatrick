import { MobileCta } from './widgets/mobile-cta';
import { SquadSection } from './squad-section';
import { ModeShowcaseSection } from './mode-showcase-section';
import { MatchDashboard } from './dashboard/match-dashboard';

/** The whole below-hero experience as one continuous dashboard (the footer stays separate). */
export function HomeDashboard() {
  return (
    <div className="relative z-10">
      <div aria-hidden className="curtain-seam h-24 bg-gradient-to-b from-transparent to-background md:h-32" />
      <div className="bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-4 pb-6 md:pt-6">
          <MatchDashboard />

          <SquadSection />
        </div>

        <ModeShowcaseSection />

        <div className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-10 md:pb-14">
          <MobileCta />
        </div>
      </div>
    </div>
  );
}
