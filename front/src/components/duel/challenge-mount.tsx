'use client';

import { useRouter } from 'next/navigation';

import { MatchmakingDialog } from '@/components/fantasy/matchmaking-dialog';
import { useUiStore } from '@/store/ui.store';
import { useDuelStore } from '@/store/duel.store';

/** Bridges "Challenge a friend" → the ready-check dialog → the 1v1 arena. Mounted once app-wide. */
export function ChallengeMount() {
  const router = useRouter();
  const opponent = useUiStore((s) => s.challengeOpponent);
  const bet = useUiStore((s) => s.challengeBet);
  const closeChallenge = useUiStore((s) => s.closeChallenge);
  const startDuel = useDuelStore((s) => s.start);

  const confirm = () => {
    if (!opponent) return;
    const id = opponent.username;
    startDuel(id, opponent);
    closeChallenge();
    router.push(`/duel/${id}`);
  };

  return (
    <MatchmakingDialog
      open={Boolean(opponent)}
      opponent={opponent ?? undefined}
      bet={bet}
      onOpenChange={(next) => {
        if (!next) closeChallenge();
      }}
      onConfirm={confirm}
    />
  );
}
