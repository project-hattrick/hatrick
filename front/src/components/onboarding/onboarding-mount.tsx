'use client';

import { useOnboardingStore } from '@/store/onboarding.store';
import { OnboardingDialog } from './onboarding-dialog';

const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * The real first-login onboarding is fused into the login dialog (see login-dialog.tsx).
 * This mount only carries the standalone copy of the flow, force-opened via
 * onboarding.store (e.g. for testing) — the pinned dev trigger button has been removed.
 */
export function OnboardingMount() {
  const forcedOpen = useOnboardingStore((s) => s.forcedOpen);
  const closeForced = useOnboardingStore((s) => s.closeForced);

  if (!IS_DEV || !forcedOpen) return null;

  return (
    <OnboardingDialog
      open
      onOpenChange={(next) => {
        if (!next) closeForced();
      }}
    />
  );
}
