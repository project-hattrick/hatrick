import { ParallaxStage } from './parallax-stage';
import { SiteNavbar } from '@/components/common/site-navbar';
import { LiveDashboard } from '@/components/live/live-dashboard';
import { LandingIntro } from './landing-intro';
import { HomeDashboard } from './home-dashboard';
import { LiveScorebar } from './live-scorebar';
import { SiteFooter } from './site-footer';

/** Hero scrolls away in normal flow; the live scoreboard pins at the hero↔dashboard seam and stays. */
export function HomeExperience() {
  return (
    <div className="relative w-full">
      <LandingIntro />
      <SiteNavbar heroBackdrop />

      {/* Hero — cinematic first screen; the stage sits behind it and scrolls away with it. */}
      <div className="relative overflow-hidden">
        <ParallaxStage />
        <div className="relative z-10">
          <LiveDashboard />
        </div>
      </div>

      {/* Live scoreboard — pins under the navbar at the seam and persists down the dashboard. */}
      <LiveScorebar />
      <HomeDashboard />
      <SiteFooter />
    </div>
  );
}
