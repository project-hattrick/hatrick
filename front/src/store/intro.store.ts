import { create } from 'zustand';

import { IntroStep, INTRO_ORDER } from '@/enums/intro-step.enum';

interface IntroStore {
  /** Whether the intro tour modal is open. */
  open: boolean;
  /** Current step. */
  step: IntroStep;
  /** Open the tour at the first step. */
  openIntro: () => void;
  /** Close the tour. */
  close: () => void;
  /** Advance to the next step (no-op on the last step). */
  next: () => void;
  /** Go back one step (no-op on the first step). */
  back: () => void;
}

/**
 * Drives the `?onboarding=true` intro tour. Deliberately NOT persisted: the mount reads the URL
 * param and a per-session flag decides whether to open, so the store only holds live UI state.
 */
export const useIntroStore = create<IntroStore>((set, get) => ({
  open: false,
  step: IntroStep.Live,
  openIntro: () => set({ open: true, step: IntroStep.Live }),
  close: () => set({ open: false }),
  next: () => {
    const i = INTRO_ORDER.indexOf(get().step);
    if (i < INTRO_ORDER.length - 1) set({ step: INTRO_ORDER[i + 1] });
  },
  back: () => {
    const i = INTRO_ORDER.indexOf(get().step);
    if (i > 0) set({ step: INTRO_ORDER[i - 1] });
  },
}));
