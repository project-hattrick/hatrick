'use client';

import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { OnboardingDialog } from './onboarding-dialog';

/**
 * Fires the first-login onboarding flow once. Mounted app-wide next to the other global
 * modals; opens when the player has a session but hasn't onboarded yet. Any close (finish,
 * skip, X) marks it done so it never nags again.
 */
export function OnboardingMount() {
  const token = useAuthStore((s) => s.token);
  const hasOnboarded = useOnboardingStore((s) => s.hasOnboarded);
  const hydrated = useOnboardingStore((s) => s.hydrated);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  // Wait for persist to rehydrate so a returning user never sees a flash of the flow.
  if (!hydrated) return null;

  const shouldShow = Boolean(token) && !hasOnboarded;
  if (!shouldShow) return null;

  return (
    <OnboardingDialog
      open
      onOpenChange={(next) => {
        if (!next) completeOnboarding();
      }}
    />
  );
}
