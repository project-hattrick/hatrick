'use client';

import { useUiStore } from '@/store/ui.store';
import { Button } from '@/components/ui/button';
import { Sword } from '@/components/common/icons';
import type { PlayerProfile } from '@/config/duelists.config';

interface ChallengeButtonProps {
  profile: PlayerProfile;
}

/** Opens the global challenge dialog pre-filled with the given player profile. */
export function ChallengeButton({ profile }: ChallengeButtonProps) {
  const openChallenge = useUiStore((s) => s.openChallenge);

  return (
    <Button size="sm" onClick={() => openChallenge(profile)}>
      <Sword /> Challenge
    </Button>
  );
}
