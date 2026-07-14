'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sword, Coins } from '@/components/common/icons';
import { formatTokens } from '@/components/fantasy/bet-selector';
import { useDuelInviteStore } from '@/store/duel-invite.store';

/**
 * App-wide overlay shown when the signed-in user receives a PvP duel invite
 * via the `duel:invite` socket event. Accept navigates to the join page;
 * Decline clears the invite silently.
 */
export function DuelInviteDialog() {
  const router = useRouter();
  const invite = useDuelInviteStore((s) => s.invite);
  const clearInvite = useDuelInviteStore((s) => s.clearInvite);

  const handleAccept = () => {
    if (!invite) return;
    clearInvite();
    router.push(`/duel/join/${invite.duelId}`);
  };

  const handleDecline = () => {
    clearInvite();
  };

  return (
    <Dialog open={Boolean(invite)} onOpenChange={(open) => { if (!open) handleDecline(); }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-neon">
            <Sword className="size-6" />
            <DialogTitle>You have been challenged!</DialogTitle>
          </div>
          <DialogDescription>
            <span className="font-semibold text-foreground">{invite?.hostName ?? 'Someone'}</span>
            {' '}is challenging you to a 1v1 duel.
          </DialogDescription>
        </DialogHeader>

        {invite && invite.stake > 0 && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-neon/25 bg-neon/[0.06] px-4 py-3">
            <Coins className="size-4 text-neon" weight="fill" />
            <span className="font-mono text-sm font-bold text-neon">
              {formatTokens(invite.stake)} tokens each · {formatTokens(invite.stake * 2)} pot
            </span>
          </div>
        )}

        {invite && invite.stake === 0 && (
          <p className="text-center text-sm text-muted-foreground">Friendly match — no tokens at stake.</p>
        )}

        <DialogFooter className="mt-1 flex-col gap-2 sm:flex-col">
          <Button shape="pill" className="w-full gap-2" onClick={handleAccept}>
            <Sword className="size-4" weight="fill" />
            Accept &amp; pick your XI
          </Button>
          <Button variant="outline" shape="pill" className="w-full" onClick={handleDecline}>
            Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
