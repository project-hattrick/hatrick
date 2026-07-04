'use client';

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
import { useAuth } from '@/services/queries/use-auth';

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
 * "Sign in with Solana" modal — a two-step flow (connect → sign) built on the
 * shared Dialog shell, then the signed-in account view (mini profile + links).
 * The auto-connect/sign driver lives in WalletAuthSync; this dialog just
 * renders the current step.
 */
export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { connected, disconnect } = useWallet();
  const { isAuthenticated, user } = useAuth();

  const step =
    isAuthenticated && user
      ? LoginStep.Account
      : connected
        ? LoginStep.Sign
        : LoginStep.Connect;
  const heading = HEADINGS[step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
      </DialogContent>
    </Dialog>
  );
}
