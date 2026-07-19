'use client';

import { useEffect, useState } from 'react';

import { useAgeGateStore } from '@/store/age-gate.store';
import { useIntroStore } from '@/store/intro.store';
import { IntroDialog } from './intro-dialog';

const ONBOARDING_PARAM = 'onboarding';
const SHOWN_KEY = 'hat-intro-shown';

/**
 * Opens the intro tour on a visitor's FIRST visit to the app (once per browser), and ALWAYS when
 * the URL carries `?onboarding=true` (the submission link — reopens on every visit). Waits for the
 * 18+ age gate to clear first, so the two non-dismissable modals never stack.
 */
export function IntroMount() {
  const openIntro = useIntroStore((s) => s.openIntro);
  const confirmedAdult = useAgeGateStore((s) => s.confirmedAdult);
  const [wantOpen, setWantOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromLink = new URLSearchParams(window.location.search).get(ONBOARDING_PARAM) === 'true';
    let firstVisit = false;
    try {
      firstVisit = !window.localStorage.getItem(SHOWN_KEY);
    } catch {
      /* private mode — treat as returning visitor so we never loop */
    }
    setWantOpen(fromLink || firstVisit);
  }, []);

  useEffect(() => {
    if (!wantOpen || !confirmedAdult) return;
    openIntro();
    try {
      window.localStorage.setItem(SHOWN_KEY, '1');
    } catch {
      /* ignore */
    }
  }, [wantOpen, confirmedAdult, openIntro]);

  return <IntroDialog />;
}
