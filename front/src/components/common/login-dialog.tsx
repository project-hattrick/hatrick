'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

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
import { useAuth } from '@/services/queries/use-auth';
import { useSignInMutation } from '@/services/queries/use-sign-in';

const short = (address: string): string =>
  `${address.slice(0, 4)}…${address.slice(-4)}`;

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** "Sign in with Solana" modal, opened from the navbar profile avatar. */
export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { setVisible } = useWalletModal();
  const { disconnect } = useWallet();
  const { isConnected, isConnecting, isAuthenticated, isAuthenticating, user } =
    useAuth();
  const signIn = useSignInMutation();
  const busy = isConnecting || isAuthenticating || signIn.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {isAuthenticated && user ? (
          <>
            <DialogHeader>
              <DialogTitle>Your account</DialogTitle>
              <DialogDescription>
                Signed in with your Solana wallet.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <Avatar
                name={user.displayName ?? short(user.walletAddress)}
                className="size-12"
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-semibold">
                  {user.displayName ?? short(user.walletAddress)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="size-3.5" /> {short(user.walletAddress)} · devnet
                </span>
                <span className="text-xs text-muted-foreground">
                  Balance: {user.balance}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void disconnect();
                onOpenChange(false);
              }}
            >
              Sign out
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Sign in with Solana</DialogTitle>
              <DialogDescription>
                Connect your wallet and sign a message — free and gasless, no SOL
                or password needed.
              </DialogDescription>
            </DialogHeader>

            {busy ? (
              <div className="flex items-center gap-3 rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
                <span className="size-4 animate-spin rounded-full border-2 border-neon border-t-transparent" />
                {isConnecting
                  ? 'Connecting wallet…'
                  : 'Approve the signature in your wallet…'}
              </div>
            ) : !isConnected ? (
              <Button
                className="w-full"
                onClick={() => {
                  onOpenChange(false); // avoid stacking over the wallet picker
                  setVisible(true);
                }}
              >
                <Wallet className="size-4" /> Connect Solana wallet
              </Button>
            ) : (
              <Button className="w-full" onClick={() => signIn.mutate()}>
                Sign message to finish
              </Button>
            )}

            {signIn.isError ? (
              <p className="text-xs text-destructive">
                {(signIn.error as Error)?.message ?? 'Sign-in failed — try again.'}
              </p>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
