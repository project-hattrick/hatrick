'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sword, Lightning } from '@/components/common/icons';
import { BetSelector } from '@/components/fantasy/bet-selector';
import { BET_AMOUNTS } from '@/config/matchmaking.config';
import { duelService } from '@/services/fantasy.service';
import { isChainSession } from '@/services/session-mode';
import { useDepositDuelStake } from '@/services/queries/use-deposit-duel-stake';
import { useWalletStore } from '@/store/wallet.store';
import { useFantasyStore } from '@/store/fantasy.store';
import type { PlayerProfile } from '@/config/duelists.config';

interface PvpChallengeDialogProps {
  /** The real user being challenged — must have a proper backend id (not 'd*' mock). */
  opponent: PlayerProfile | null;
  onClose: () => void;
}

/**
 * Host side of a PvP challenge: pick the stake, lock the XI, POST /duels (pvp:true),
 * then navigate to the waiting screen until the guest joins and duel:ready fires.
 */
export function PvpChallengeDialog({ opponent, onClose }: PvpChallengeDialogProps) {
  const router = useRouter();
  const [stake, setStake] = useState<number>(BET_AMOUNTS[0] ?? 0);
  const [loading, setLoading] = useState(false);
  const depositStake = useDepositDuelStake();

  const handleChallenge = async () => {
    if (!opponent) return;
    setLoading(true);
    try {
      const fantasy = useFantasyStore.getState();
      const ownedCardIds = fantasy.squad
        .map((i) => fantasy.collection[i]?.ownedCardId)
        .filter(Boolean) as string[];

      if (!ownedCardIds.length) {
        toast.error('Build your XI in Fantasy before challenging a friend.');
        return;
      }

      const res = await duelService.create({
        pvp: true,
        opponentUserId: opponent.id,
        stake,
        mode: stake > 0 ? 'Ranked' : 'Friendly',
        formation: fantasy.formation,
        ownedCardIds,
      });

      useWalletStore.getState().hydrate(Number(res.balance));

      // On-chain path: deposit the host's stake immediately after create.
      if (stake > 0 && isChainSession()) {
        await new Promise<void>((resolve, reject) => {
          depositStake.mutate(res.duel.id, {
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
          });
        });
      }

      onClose();
      router.push(`/duel/waiting/${res.duel.id}`);
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Failed to send challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={Boolean(opponent)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-neon">
            <Sword className="size-6" />
            <DialogTitle>Challenge {opponent?.name ?? 'Friend'}</DialogTitle>
          </div>
          <DialogDescription>
            Pick a stake and your current Fantasy XI will be locked in.
            Your opponent will receive an invite notification.
          </DialogDescription>
        </DialogHeader>

        <BetSelector amount={stake} onSelect={setStake} className="py-2" />

        <DialogFooter className="mt-1">
          <Button
            shape="pill"
            className="w-full gap-2"
            disabled={loading || depositStake.isPending}
            onClick={() => void handleChallenge()}
          >
            <Lightning className="size-4" weight="fill" />
            {loading || depositStake.isPending ? 'Sending challenge…' : 'Send challenge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
