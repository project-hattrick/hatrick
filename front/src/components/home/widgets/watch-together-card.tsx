'use client';

import { UserPlus, Users } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { Button } from '@/components/ui/button';
import { AppMode } from '@/enums/app-mode.enum';
import { useHomeEntryStore } from '@/store/home-entry.store';

/** Invite card in the live rail: opens the "How do you want to watch?" chooser. */
export function WatchTogetherCard() {
  const openMode = useHomeEntryStore((state) => state.openMode);

  return (
    <GlassPanel
      tone="surface"
      className="flex flex-1 flex-col justify-center gap-3 border-neon/25 bg-gradient-to-br from-neon/10 to-transparent p-4"
    >
      <div className="flex items-center gap-2">
        <Users className="size-5 text-neon" />
        <span className="text-sm font-bold">Watch together</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Start a session and invite your crew to watch and predict in real time.
      </p>
      <div className="flex items-center gap-1.5">
        <span className="size-6 rounded-full border-2 border-background bg-gradient-to-br from-surface-3 to-surface-deep" />
        <span className="-ml-3 size-6 rounded-full border-2 border-background bg-gradient-to-br from-team-away/70 to-team-away/10" />
        <span className="-ml-3 grid size-6 place-items-center rounded-full border-2 border-dashed border-neon/50 bg-foreground/5 text-xs font-bold text-neon">
          +
        </span>
        <span className="ml-1 text-xs text-muted-foreground">2 friends online</span>
      </div>
      <Button className="h-9 w-full gap-1.5 font-semibold" onClick={() => openMode(AppMode.Live)}>
        <UserPlus className="size-4" />
        Start session
      </Button>
    </GlassPanel>
  );
}
