import { ParallaxStage } from './parallax-stage';
import { SiteNavbar } from '@/components/common/site-navbar';
import { LiveDashboard } from '@/components/live/live-dashboard';
import { LandingIntro } from './landing-intro';
import { HomeDashboard } from './home-dashboard';
import { SiteFooter } from './site-footer';
import { ThemeSwitcher } from '@/components/common/theme-switcher';

/** Pinned hero + the dashboard that rises up and curtains over it on scroll. */
export function HomeExperience() {
  return (
    <div className="relative w-full">
      <LandingIntro />
      <ParallaxStage />
      <SiteNavbar />
      <div className="relative z-10">
        <div className="sticky top-0 z-0 h-screen overflow-hidden">
          <LiveDashboard />
        </div>
        <HomeDashboard />
        <SiteFooter />
      </div>
      <ThemeSwitcher />
    </div>
  );
}
