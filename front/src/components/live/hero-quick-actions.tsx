'use client';

import { type ReactNode } from 'react';

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChatCircle, SoccerBall, Target, type Icon } from '@/components/common/icons';
import { CrowdPanel } from '@/components/crowd/crowd-panel';
import { MyPredictionsPanel } from './my-predictions-panel';
import { PlayerFocusCard } from './player-focus-card';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';

/** One small glass button that opens its panel in a modal (the panel keeps its own header). */
function QuickAction({ icon: IconGlyph, label, children }: { icon: Icon; label: string; children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label={label}
        className="grid size-9 place-items-center rounded-full border border-white/15 bg-overlay/55 text-white/85 backdrop-blur-md transition hover:bg-overlay/70"
      >
        <IconGlyph className="size-4.5" />
      </DialogTrigger>
      <DialogContent className="p-3 sm:p-4">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Mobile-only quick actions above the replay bar: the desktop rail panels (crowd chat, my
 * predictions, on-the-ball focus) as small buttons that open each panel in a modal.
 */
export function HeroQuickActions() {
  return (
    <div className="pointer-events-auto flex items-center gap-2">
      <QuickAction icon={ChatCircle} label="Live crowd chat">
        <div className="flex h-[60svh] min-h-0 flex-col">
          <CrowdPanel fixtureId={MOCK_FIXTURE_ID} />
        </div>
      </QuickAction>
      <QuickAction icon={Target} label="My predictions">
        <MyPredictionsPanel />
      </QuickAction>
      <QuickAction icon={SoccerBall} label="On the ball">
        <PlayerFocusCard />
      </QuickAction>
    </div>
  );
}
