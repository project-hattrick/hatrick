'use client';

import { useState, type ReactNode } from 'react';
import { MatchmakingDialog } from './matchmaking-dialog';
import { useAuthGate } from '@/hooks/use-auth-gate';

/** A trigger that opens the ranked-duel matchmaking modal (login-gated). Style comes from `className`. */
export function DuelLauncher({ className, children }: { className?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const gate = useAuthGate();
  return (
    <>
      <button type="button" onClick={gate(() => setOpen(true))} className={className}>
        {children}
      </button>
      <MatchmakingDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
