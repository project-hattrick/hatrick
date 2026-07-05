'use client';

import { useState } from 'react';
import { Sword } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { Button } from '@/components/ui/button';
import { MatchmakingDialog } from '@/components/fantasy/matchmaking-dialog';

/** "Find match" tile — opens ranked matchmaking, which routes into the 2D duel arena. */
export function FindMatchCta() {
  const [open, setOpen] = useState(false);
  return (
    <GlassPanel radius="xl" tone="surface" className="flex items-center gap-4 p-5">
      <Sword className="size-8 text-neon" />
      <div className="flex flex-1 flex-col">
        <span className="font-bold">1v1 simulated match</span>
        <span className="text-xs text-muted-foreground">Attribute-driven match against a ranked opponent.</span>
      </div>
      <Button onClick={() => setOpen(true)}>Find match</Button>
      <MatchmakingDialog open={open} onOpenChange={setOpen} />
    </GlassPanel>
  );
}
