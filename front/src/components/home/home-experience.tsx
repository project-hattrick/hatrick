import { ParallaxStage } from './parallax-stage';
import { SiteNavbar } from '@/components/common/site-navbar';
import { LiveDashboard } from '@/components/live/live-dashboard';
import { MiniMatchSummary } from '@/components/live/mini-match-summary';
import { HomeDashboard } from './home-dashboard';
import { SiteFooter } from './site-footer';

/** Pinned hero + the dashboard that rises up and curtains over it on scroll. */
export function HomeExperience() {
  return (
    <div className="relative w-full">
      <ParallaxStage />
      <SiteNavbar />
      <MiniMatchSummary />
      <div className="relative z-10">
        <div className="sticky top-0 z-0 h-screen overflow-hidden">
          <LiveDashboard />
        </div>
        <HomeDashboard />
        <SiteFooter />
      </div>
    </div>
  );
}
