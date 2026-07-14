'use client';

import { useState } from 'react';
import { Sword } from '@/components/common/icons';
import { Button } from '@/components/ui/button';
import { PvpChallengeDialog } from '@/components/duel/pvp-challenge-dialog';
import { isBackendSession } from '@/services/session-mode';
import type { PlayerProfile } from '@/config/duelists.config';

interface PvpChallengeButtonProps {
  profile: PlayerProfile;
}

/**
 * Real-user PvP challenge button — shown alongside FriendButton on the friends surface.
 * Only visible when the app is running in backend session mode (isBackendSession).
 * Opens the stake picker dialog; the persona-based ChallengeButton stays untouched.
 */
export function PvpChallengeButton({ profile }: PvpChallengeButtonProps) {
  const [open, setOpen] = useState(false);

  if (!isBackendSession()) return null;

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Sword /> PvP Challenge
      </Button>
      <PvpChallengeDialog
        opponent={open ? profile : null}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
