/** Ordered steps of the first-login onboarding flow: reward first, then squad, then out into the app. */
export const enum OnboardingStep {
  Pack = 'pack',
  Squad = 'squad',
  Done = 'done',
}

/** Wizard order — drives the progress bar. */
export const ONBOARDING_ORDER: OnboardingStep[] = [OnboardingStep.Pack, OnboardingStep.Squad, OnboardingStep.Done];
