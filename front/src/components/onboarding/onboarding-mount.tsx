'use client';

import { Button } from '@/components/ui/button';
import { Sparkle } from '@/components/common/icons';
import { useOnboardingStore } from '@/store/onboarding.store';
import { OnboardingDialog } from './onboarding-dialog';

const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * The real first-login onboarding is fused into the login dialog (see login-dialog.tsx).
 * This mount only carries the dev trigger, which force-opens a standalone copy of the flow
 * for testing without touching the persisted flag.
 */
export function OnboardingMount() {
  const hydrated = useOnboardingStore((s) => s.hydrated);
  const forcedOpen = useOnboardingStore((s) => s.forcedOpen);
  const openOnboarding = useOnboardingStore((s) => s.openOnboarding);
  const closeForced = useOnboardingStore((s) => s.closeForced);

  if (!IS_DEV) return null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        shape="pill"
        variant="outline"
        onClick={openOnboarding}
        className="fixed right-4 bottom-4 z-40 gap-1.5 shadow-e3"
      >
        <Sparkle className="size-4 text-neon" weight="fill" />
        Onboarding
      </Button>

      {hydrated && forcedOpen && (
        <OnboardingDialog
          open
          onOpenChange={(next) => {
            if (!next) closeForced();
          }}
        />
      )}
    </>
  );
}
