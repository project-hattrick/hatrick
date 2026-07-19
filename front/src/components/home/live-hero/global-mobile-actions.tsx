'use client';

import { type ReactNode } from 'react';

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChartBar, ChatCircle, Ticket, type Icon } from '@/components/common/icons';
import { BetSlip } from '@/components/live/bet-slip';
import { RoomBetPanel } from '@/components/room/room-bet-panel';
import { GlobalSocialPanel, type SocialTab } from './global-social-panel';

/** One glass pill that opens its hero widget in a modal (panels keep their own header). */
function Action({ icon: IconGlyph, label, children }: { icon: Icon; label: string; children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label={label}
        className="inline-flex min-w-[5.25rem] items-center justify-center gap-1.5 rounded-full border border-white/15 bg-overlay/70 px-4 py-2.5 text-xs font-semibold text-white/90 shadow-lg shadow-black/20 backdrop-blur-md transition hover:border-white/25 hover:bg-overlay/85 active:scale-95"
      >
        <IconGlyph className="size-4 shrink-0 text-neon" weight="fill" />
        {label}
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/** A pill that opens the hero social widget already on a specific tab. */
function SocialAction({ icon, label, tab }: { icon: Icon; label: string; tab: SocialTab }) {
  return (
    <Action icon={icon} label={label}>
      <div className="flex h-[70svh] min-h-0 flex-col">
        <GlobalSocialPanel className="flex-1" initialTab={tab} />
      </div>
    </Action>
  );
}

/**
 * Mobile-only: the hero widgets as labelled pills. Stats and Crowd are split into their own
 * buttons (each opens the social panel on its matching tab) so it's obvious what each one does.
 */
export function GlobalMobileActions() {
  return (
    <div className="absolute inset-x-3 bottom-20 z-20 flex items-center justify-center gap-2 xl:hidden">
      <SocialAction icon={ChartBar} label="Stats" tab="stats" />
      <SocialAction icon={ChatCircle} label="Crowd" tab="crowd" />
      <Action icon={Ticket} label="Bet">
        <div className="flex max-h-[75svh] min-h-0 flex-col gap-3 p-3">
          <RoomBetPanel className="min-h-0 flex-1" />
          <BetSlip />
        </div>
      </Action>
    </div>
  );
}
