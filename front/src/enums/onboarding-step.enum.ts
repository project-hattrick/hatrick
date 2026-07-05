/** Ordered steps of the first-login onboarding wizard. */
export const enum OnboardingStep {
  Welcome = 'welcome',
  FavoriteTeam = 'favorite-team',
  Pack = 'pack',
  Squad = 'squad',
  Done = 'done',
}

/** Wizard order — drives the progress bar and next/back navigation. */
export const ONBOARDING_ORDER: OnboardingStep[] = [
  OnboardingStep.Welcome,
  OnboardingStep.FavoriteTeam,
  OnboardingStep.Pack,
  OnboardingStep.Squad,
  OnboardingStep.Done,
];
