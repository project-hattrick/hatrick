'use client';

import { useWallet } from '@solana/wallet-adapter-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Wallet } from '@/components/common/icons';
import { WalletStep } from '@/components/common/login/wallet-step';
import { SignStep } from '@/components/common/login/sign-step';
import { formatThousands, shortAddress } from '@/lib/format';
import { useAuth } from '@/services/queries/use-auth';
import type { AuthUser } from '@/services/auth.service';

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
 * shared Dialog shell, then the signed-in account view. The auto-connect/sign
 * driver lives in WalletAuthSync; this dialog just renders the current step.
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
          <AccountView
            user={user}
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

/** Signed-in summary: identity + balance + sign out. */
function AccountView({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const name = user.displayName ?? shortAddress(user.walletAddress);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.04] p-3">
        <Avatar name={name} className="size-12" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{name}</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="size-3.5" /> {shortAddress(user.walletAddress)} · devnet
          </span>
          <span className="text-xs text-muted-foreground">
            Balance: {formatThousands(Number(user.balance))}
          </span>
        </div>
      </div>
      <Button variant="outline" shape="pill" className="w-full" onClick={onSignOut}>
        Sign out
      </Button>
    </div>
  );
}
