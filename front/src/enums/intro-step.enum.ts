/**
 * Steps of the judge-facing intro tour (opened by `?onboarding=true`). Distinct from the
 * post-login product onboarding (`onboarding-step.enum.ts`, Pack→Squad→Done) — this one is a
 * marketing walkthrough of what Hatrick is.
 */
export enum IntroStep {
  Welcome = 'welcome',
  Live = 'live',
  Fantasy = 'fantasy',
}

/** Display order — drives the stepper and next/back navigation. */
export const INTRO_ORDER = [IntroStep.Welcome, IntroStep.Live, IntroStep.Fantasy] as const;
