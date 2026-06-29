import { ParallaxStage } from './parallax-stage';
import { SiteNavbar } from '@/components/common/site-navbar';
import { LiveDashboard } from '@/components/live/live-dashboard';
import { ModesSection } from './modes-section';
import { HowItWorksSection } from './how-it-works-section';
import { FeaturedSection } from './featured-section';
import { SiteFooter } from './site-footer';

/** Scrollable landing: fixed parallax stage + navbar, hero, then placeholder sections. */
export function HomeExperience() {
  return (
    <div className="relative w-full">
      <ParallaxStage />
      <SiteNavbar />
      <div className="relative z-10">
        <LiveDashboard />
        <ModesSection />
        <HowItWorksSection />
        <FeaturedSection />
        <SiteFooter />
      </div>
    </div>
  );
}
