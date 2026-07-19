import type { ComponentType } from 'react';

import { Trophy, Lightning, Cards, type IconProps } from '@/components/common/icons';
import { IntroStep } from '@/enums/intro-step.enum';

export interface IntroStepContent {
  step: IntroStep;
  icon: ComponentType<IconProps>;
  /** Autoplayed clip for the step (user-provided; the dialog shows a placeholder until it exists). */
  videoSrc: string;
  /** Still shown before the clip plays / while it loads. */
  poster?: string;
}

/**
 * Per-step media. Drop the clips into `public/onboarding/` — the dialog degrades to a branded
 * placeholder when a file is missing, so the tour is usable before the videos are recorded.
 */
export const INTRO_STEPS: IntroStepContent[] = [
  { step: IntroStep.Welcome, icon: Trophy, videoSrc: '/onboarding/welcome.mp4', poster: '/onboarding/welcome-poster.webp' },
  { step: IntroStep.Live, icon: Lightning, videoSrc: '/onboarding/live.mp4', poster: '/onboarding/live-poster.webp' },
  { step: IntroStep.Fantasy, icon: Cards, videoSrc: '/onboarding/fantasy.mp4', poster: '/onboarding/fantasy-poster.webp' },
];
