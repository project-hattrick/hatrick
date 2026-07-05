'use client';

import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AccountStep } from '@/components/common/login/account-step';
import { WalletStep } from '@/components/common/login/wallet-step';
import { SignStep } from '@/components/common/login/sign-step';
import { PackOpening } from '@/components/store/pack-opening';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { useOnboardingController, STARTER_PACK_SIZE } from '@/components/onboarding/use-onboarding-controller';
import { OnboardingStep } from '@/enums/onboarding-step.enum';
import { cn } from '@/lib/utils';
import { useAuth } from '@/services/queries/use-auth';
import { useOnboardingStore } from '@/store/onboarding.store';

/** How the modal grows so the pack plays inside it instead of taking over the screen. */
const PACK_EXPANDED = 'h-[92vh] w-[92vw] max-w-[92vw] overflow-hidden p-0 sm:max-w-[92vw] sm:p-0';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Which screen the flow is on, derived purely from wallet + auth state. */
enum LoginStep {
  Connect = 'connect',
  Sign = 'sign',
  Account = 'account',
}

const HEADINGS: Record<LoginStep, { title: string; description: string }> = {
  [LoginStep.Connect]: {
    title: 'Connect your wallet',
    description: 'Sign in without a password and own your cards on-chain.',
  },
  [LoginStep.Sign]: {
    title: 'Confirm it’s you',
    description: 'Approve a one-time signature in your wallet to finish signing in.',
  },
  [LoginStep.Account]: {
    title: 'Your account',
    description: 'Signed in with your Solana wallet.',
  },
};

/**
 * "Sign in with Solana" modal — connect → sign, then on a first sign-in it flows straight into
 * onboarding (open pack → set formation → done) in the same shell; returning users land on the
 * account view. The auto-connect/sign driver lives in WalletAuthSync.
 */
export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const router = useRouter();
  const { connected, disconnect } = useWallet();
  const { isAuthenticated, user } = useAuth();
  const hasOnboarded = useOnboardingStore((s) => s.hasOnboarded);
  const dismiss = useOnboardingStore((s) => s.dismiss);
  const controller = useOnboardingController();

  // First sign-in: continue into onboarding right here instead of the account view.
  const onboarding = isAuthenticated && Boolean(user) && !hasOnboarded;

  const exitOnboarding = (path?: string) => {
    dismiss();
    onOpenChange(false);
    if (path) router.push(path);
  };

  const step =
    isAuthenticated && user
      ? LoginStep.Account
      : connected
        ? LoginStep.Sign
        : LoginStep.Connect;
  const heading = HEADINGS[step];
  const packing = onboarding && controller.packOpen;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!packing}
        className={cn(
          'transition-[width,height,max-width,padding] duration-300 ease-soft',
          packing && PACK_EXPANDED,
          onboarding && !packing && 'max-h-[calc(100dvh-2rem)] overflow-y-auto',
          onboarding && !packing && controller.step === OnboardingStep.Squad && 'sm:max-w-3xl',
        )}
      >
        {packing ? (
          // Expand the login modal and play the pack inside it — no full-screen takeover.
          <>
            <DialogTitle className="sr-only">Opening your Starter Pack</DialogTitle>
            <PackOpening
              embedded
              hideTrigger
              open
              packName="Starter Pack"
              packSize={STARTER_PACK_SIZE}
              onClose={controller.closePack}
              onComplete={controller.completePack}
            />
          </>
        ) : onboarding ? (
          <OnboardingFlow controller={controller} onExit={exitOnboarding} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{heading.title}</DialogTitle>
              <DialogDescription>{heading.description}</DialogDescription>
            </DialogHeader>

            {step === LoginStep.Account && user ? (
              <AccountStep
                user={user}
                onClose={() => onOpenChange(false)}
                onSignOut={() => {
                  void disconnect();
                  onOpenChange(false);
                }}
              />
            ) : step === LoginStep.Sign ? (
              <SignStep />
            ) : (
              <WalletStep />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
