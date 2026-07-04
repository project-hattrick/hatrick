'use client';

import { useState, type ReactNode } from 'react';
import { MatchmakingDialog } from './matchmaking-dialog';

/** A trigger that opens the ranked-duel matchmaking modal. Style comes from `className`. */
export function DuelLauncher({ className, children }: { className?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <MatchmakingDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
