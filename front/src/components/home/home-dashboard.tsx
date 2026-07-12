import { FaqSection } from './faq-section';
import { SquadSection } from './squad-section';
import { ModeShowcaseSection } from './mode-showcase-section';
import { MatchDashboard } from './dashboard/match-dashboard';

/** The whole below-hero experience as one continuous dashboard (the footer stays separate). */
export function HomeDashboard() {
  return (
    <div className="relative z-10">
      <div className="bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-4 pb-6 sm:px-6 md:pt-6">
          <MatchDashboard />

          <SquadSection />
        </div>

        <ModeShowcaseSection />

        <FaqSection />
      </div>
    </div>
  );
}
