'use client';

import { Globe, Users } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { Scoreboard } from '@/components/live/scoreboard';
import { MatchTimeline } from '@/components/live/match-timeline';
import { PoweredByTxline } from '@/components/common/powered-by-txline';
import { RoomMatchBackdrop } from '@/components/room/room-match-backdrop';
import { RoomBetSlip } from '@/components/room/room-bet-slip';
import { RoomResultDock } from '@/components/room/room-result-dock';
import { RoomBetPanel } from '@/components/room/room-bet-panel';
import { RoomPickToast } from '@/components/room/room-pick-toast';
import { RoomMiniPitch } from '@/components/room/room-mini-pitch';
import { ImpactSlide } from '@/components/room/impact-slide';
import { formatCompact } from '@/lib/format';
import { HeroCardsBadge } from './hero-cards-badge';
import { GlobalSocialPanel } from './global-social-panel';

const VIEWERS = 12_400;

/** Compact header for the split rail — the public "everyone's watching" strip (no invites). */
function GlobalRailHeader() {
  return (
    <GlassPanel tone="dark" radius="lg" className="flex shrink-0 items-center gap-2 px-3 py-2">
      <Globe className="size-4 shrink-0 text-neon" weight="duotone" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">Global live · everyone&apos;s in</span>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Users className="size-3.5" /> {formatCompact(VIEWERS)}
      </span>
    </GlassPanel>
  );
}

/**
 * Split global live view: framed live match on the left (scoreboard, public
 * backers, mini watcher and timeline over the pitch), bet + stats/crowd rail on
 * the right — the room split layout, made public. On beats only the bet CTA slides
 * away. Mirrors RoomSplitLayout minus everything private.
 */
export function GlobalLiveSplit() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 bg-background px-4 pt-20 md:flex-row md:overflow-hidden md:pt-[72px] md:pb-4">
      {/* Framed engine + overlays — on beats only the bet CTA slides away. */}
      <div className="relative min-h-[52vh] flex-1 overflow-hidden rounded-2xl border border-white/10 md:min-h-0">
        <RoomMatchBackdrop scrim={false} />
        <div className="absolute top-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
          <Scoreboard homeBackers={<HeroCardsBadge side="home" />} awayBackers={<HeroCardsBadge side="away" />} />
          <RoomPickToast />
        </div>
        <div className="absolute bottom-20 left-4 z-10 hidden lg:block">
          <RoomMiniPitch />
        </div>
        {/* Headline 1·X·2 dock with the data-provider credit sat right above it. */}
        <ImpactSlide
          direction="down"
          className="absolute inset-x-4 bottom-20 z-20 flex flex-col items-center gap-2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2"
        >
          <span className="inline-flex items-center rounded-full border border-white/15 bg-overlay/55 px-3 py-1.5 backdrop-blur-md">
            <PoweredByTxline tone="hero" />
          </span>
          <RoomResultDock />
        </ImpactSlide>
        <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3">
          {/* No replay/pace controls in a shared live view — timeline is a readout only. */}
          <MatchTimeline playback={false} />
        </div>
      </div>

      {/* Rail — public header, bet widget, slip and stats/crowd tabs. The bet group
          slides off the right edge during a goal beat. */}
      <div className="flex w-full min-h-0 flex-col gap-3 md:w-[392px]">
        <GlobalRailHeader />
        <ImpactSlide direction="right" className="flex min-h-0 flex-[1.3] flex-col gap-3">
          <RoomBetPanel className="min-h-0 flex-1" />
          <RoomBetSlip />
        </ImpactSlide>
        <GlobalSocialPanel className="min-h-0 flex-1" />
      </div>
    </div>
  );
}
