'use client';

import { useUiStore } from '@/store/ui.store';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { Button } from '@/components/ui/button';
import { Sword } from '@/components/common/icons';
import type { PlayerProfile } from '@/config/duelists.config';

interface ChallengeButtonProps {
  profile: PlayerProfile;
}

/** Opens the global challenge dialog pre-filled with the given player profile (login-gated). */
export function ChallengeButton({ profile }: ChallengeButtonProps) {
  const openChallenge = useUiStore((s) => s.openChallenge);
  const gate = useAuthGate();

  return (
    <Button size="sm" onClick={gate(() => openChallenge(profile))}>
      <Sword /> Challenge
    </Button>
  );
}
