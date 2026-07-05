'use client';

import { Button } from '@/components/ui/button';
import { Confetti, Sword, House, Package, SoccerBall } from '@/components/common/icons';

/** Final step — celebrate the setup and push the player into their first real action. */
export function DoneStep({
  collectionCount,
  squadCount,
  onChallenge,
  onExplore,
}: {
  collectionCount: number;
  squadCount: number;
  onChallenge: () => void;
  onExplore: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-neon/15 text-neon">
          <Confetti className="size-7" weight="fill" />
        </span>
        <p className="text-lead font-semibold">You&apos;re all set!</p>
        <p className="text-micro text-muted-foreground">Your collection is started and your XI is locked in.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/60 p-4">
          <Package className="size-6 text-neon" weight="fill" />
          <div className="flex flex-col leading-tight">
            <span className="font-mono text-lg font-bold tabular-nums">{collectionCount}</span>
            <span className="text-micro text-muted-foreground">cards owned</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/60 p-4">
          <SoccerBall className="size-6 text-neon" weight="fill" />
          <div className="flex flex-col leading-tight">
            <span className="font-mono text-lg font-bold tabular-nums">{squadCount}</span>
            <span className="text-micro text-muted-foreground">in your XI</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button size="lg" shape="pill" className="w-full gap-2" onClick={onChallenge}>
          <Sword className="size-4" weight="fill" />
          Challenge a friend
        </Button>
        <Button size="lg" shape="pill" variant="outline" className="w-full gap-2" onClick={onExplore}>
          <House className="size-4" weight="fill" />
          Explore the app
        </Button>
      </div>
    </div>
  );
}
