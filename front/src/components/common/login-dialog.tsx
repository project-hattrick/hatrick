'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WalletStep } from '@/components/common/login/wallet-step';
import { SignStep } from '@/components/common/login/sign-step';
import { EmailStep } from '@/components/common/login/email-step';
import { PackOpening } from '@/components/store/pack-opening';
import { usePackDeck } from '@/services/queries/use-pack-deck';
import { PackType } from '@/services/fantasy.service';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { useOnboardingController, STARTER_PACK_SIZE } from '@/components/onboarding/use-onboarding-controller';
import { OnboardingStep } from '@/enums/onboarding-step.enum';
import { cn } from '@/lib/utils';
import { useAuth } from '@/services/queries/use-auth';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useT } from '@/i18n/i18n-provider';

/** How the modal grows so the pack plays inside it instead of taking over the screen. */
const PACK_EXPANDED = 'h-[92vh] w-[92vw] max-w-[92vw] overflow-hidden p-0 sm:max-w-[92vw] sm:p-0';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Which screen the flow is on. */
enum LoginStep {
  Connect = 'connect',
  Sign = 'sign',
  Email = 'email',
}

/**
 * Auth modal: connects via Privy (wallet or email OTP). First registrations continue
 * into onboarding after sign-in.
 *
 * Auth gate: `usePrivy().ready && authenticated` replaces the old `useWallet().connected`
 * so the Sign step shows immediately when Privy has an active session, not when the
 * Solana adapter connects (which may lag behind or never fire for email users).
 */
export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const t = useT();
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { isAuthenticated, user } = useAuth();
  const pending = useOnboardingStore((s) => s.pending);
  const complete = useOnboardingStore((s) => s.complete);
  const controller = useOnboardingController();
  const resolveDeck = usePackDeck(PackType.Welcome);
  const [emailMode, setEmailMode] = useState(false);

  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => setEmailMode(false), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const wallet = user?.walletAddress ?? null;
  const onboarding = isAuthenticated && Boolean(wallet) && pending.includes(wallet as string);

  useEffect(() => {
    if (open && isAuthenticated && !onboarding) onOpenChange(false);
  }, [open, isAuthenticated, onboarding, onOpenChange]);

  const exitOnboarding = (path?: string) => {
    complete(wallet);
    onOpenChange(false);
    if (path) router.push(path);
  };

  // Show the Sign step while Privy is authenticated but the backend session is still
  // being exchanged, or while Privy is ready but not authenticated yet (Connect step).
  const step = emailMode
    ? LoginStep.Email
    : ready && authenticated
      ? LoginStep.Sign
      : LoginStep.Connect;

  const heading = {
    [LoginStep.Connect]: { title: t('common.login.connectTitle'), description: t('common.login.connectDescription') },
    [LoginStep.Sign]: { title: t('common.login.signTitle'), description: t('common.login.signDescription') },
    [LoginStep.Email]: { title: t('common.login.emailTitle'), description: t('common.login.emailDescription') },
  }[step];
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
          <>
            <DialogTitle className="sr-only">{t('common.login.openingPack')}</DialogTitle>
            <PackOpening
              embedded
              hideTrigger
              open
              packName={t('common.login.starterPack')}
              packSize={STARTER_PACK_SIZE}
              onClose={controller.closePack}
              onComplete={controller.completePack}
              resolveDeck={resolveDeck}
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

            {step === LoginStep.Email ? (
              <EmailStep onBack={() => setEmailMode(false)} />
            ) : step === LoginStep.Sign ? (
              <SignStep />
            ) : (
              <WalletStep onEmail={() => setEmailMode(true)} />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
