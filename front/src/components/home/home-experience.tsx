'use client';

import { ParallaxStage } from './parallax-stage';
import { SiteNavbar } from '@/components/common/site-navbar';
import { LiveDashboard } from '@/components/live/live-dashboard';
import { LandingIntro } from './landing-intro';
import { HomeDashboard } from './home-dashboard';
import { LiveScorebar } from './live-scorebar';
import { SiteFooter } from './site-footer';
import { useT } from '@/i18n/i18n-provider';

/** Hero scrolls away in normal flow; the live scoreboard pins at the hero/dashboard seam and stays. */
export function HomeExperience() {
  const t = useT();

  return (
    <div className="relative w-full">
      <h1 className="sr-only">{t('home.srTitle')}</h1>

      <LandingIntro />
      <SiteNavbar heroBackdrop />

      <div className="relative overflow-hidden">
        <ParallaxStage />
        <div className="relative z-10">
          <LiveDashboard />
        </div>
      </div>

      <LiveScorebar />
      <HomeDashboard />
      <SiteFooter />
    </div>
  );
}
