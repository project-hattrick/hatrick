import type { ComponentType } from 'react';

import { Broadcast, Cards, TrendUp, type IconProps } from '@/components/common/icons';
import { IntroStep } from '@/enums/intro-step.enum';

export interface IntroStepContent {
  step: IntroStep;
  icon: ComponentType<IconProps>;
  /** Autoplayed clip for the step. The dialog shows a placeholder/fallback until it exists. */
  videoSrc: string;
  /** Still shown before the clip plays / while it loads. */
  poster?: string;
}

/**
 * Per-step media (in `public/onboarding/`). Order: Live → Fantasy → Cards. The Cards step (real form
 * from matches buffing/nerfing your cards) uses the Remotion-rendered `cards.mp4`, and falls back to
 * the coded card animation if the file is missing.
 */
export const INTRO_STEPS: IntroStepContent[] = [
  { step: IntroStep.Live, icon: Broadcast, videoSrc: '/onboarding/live-mode.mp4' },
  { step: IntroStep.Fantasy, icon: Cards, videoSrc: '/onboarding/fantasy.mp4' },
  { step: IntroStep.Cards, icon: TrendUp, videoSrc: '/onboarding/cards.mp4' },
];
