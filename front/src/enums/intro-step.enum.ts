/**
 * Steps of the judge-facing intro tour (opened by `?onboarding=true` / first visit). Distinct from
 * the post-login product onboarding (`onboarding-step.enum.ts`, Pack→Squad→Done).
 */
export enum IntroStep {
  Live = 'live',
  Fantasy = 'fantasy',
  Cards = 'cards',
}

/** Display order — drives the stepper and next/back navigation. */
export const INTRO_ORDER = [IntroStep.Live, IntroStep.Fantasy, IntroStep.Cards] as const;
