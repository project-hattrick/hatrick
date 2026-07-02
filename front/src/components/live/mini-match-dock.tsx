'use client';

import { useRef } from 'react';
import { useLenis } from 'lenis/react';

import { GlassPanel } from '@/components/common/glass-panel';
import { LiveBadge } from '@/components/common/live-badge';
import { MatchAction } from '@/enums/match-action.enum';
import { matchActionConfig } from '@/config/match-action.config';
import { useMatch, useMatchEvents } from '@/store/match.store';
import { deriveMatchStats, type TeamStatLine } from '@/lib/match-stats';
import { cn } from '@/lib/utils';

const statRows: { action: MatchAction; key: keyof TeamStatLine }[] = [
  { action: MatchAction.Goal, key: 'goals' },
  { action: MatchAction.Corner, key: 'corners' },
  { action: MatchAction.YellowCard, key: 'yellow' },
  { action: MatchAction.RedCard, key: 'red' },
];

function Team({ flag, code, reverse }: { flag: string; code: string; reverse?: boolean }) {
  return (
    <span className={cn('flex items-center gap-1.5 text-sm font-semibold', reverse && 'flex-row-reverse')}>
      <span className="text-base leading-none" aria-hidden>{flag}</span>
      {code}
    </span>
  );
}

/** A miniature live pitch with a LIVE overlay — reads as a picture-in-picture of the match. */
function MiniPitch({ minute }: { minute: number }) {
  return (
    <div className="relative h-28 w-full bg-[repeating-linear-gradient(90deg,#0d2a18_0_12%,rgba(13,42,24,0.55)_12%_24%)]">
      <div className="absolute inset-3 rounded-sm border border-white/10" />
      <div className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-white/10" />
      <div className="absolute top-2 left-2"><LiveBadge minute={minute} className="text-[10px]" /></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
}

/** Right-docked mini-player + match-stats summary, aligned to the navbar's right edge. */
export function MiniMatchDock() {
  const match = useMatch();
  const events = useMatchEvents();
  const ref = useRef<HTMLDivElement>(null);

  useLenis(({ scroll }) => {
    const el = ref.current;
    if (!el) return;
    el.dataset.revealed = scroll > window.innerHeight * 0.4 ? 'true' : 'false';
  });

  if (!match) return null;

  const stats = deriveMatchStats(events);

  return (
    // Anchored just OUTSIDE the right edge of the max-w-7xl (80rem) content section, in
    // the gutter, so it never overlaps the dashboard. Left edge = content-right-edge +
    // gap. Only shown once the viewport is wide enough to hold the 18rem dock in the
    // gutter (needs ≈1904px).
    <div className="pointer-events-none fixed top-24 left-[calc(50%+40rem+1.5rem)] z-30">
      <div
        ref={ref}
        className="hidden w-72 translate-x-6 flex-col gap-3 opacity-0 transition-all duration-500 ease-out data-[revealed=true]:translate-x-0 data-[revealed=true]:opacity-100 min-[1904px]:flex"
      >
          <GlassPanel radius="lg" tone="dark" className="overflow-hidden p-0">
            <MiniPitch minute={match.minute} />
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <Team flag={match.home.flag} code={match.home.code} />
              <span className="text-lg font-bold tabular-nums text-neon">
                {match.score.home}-{match.score.away}
              </span>
              <Team flag={match.away.flag} code={match.away.code} reverse />
            </div>
          </GlassPanel>

          <GlassPanel radius="lg" tone="surface" className="px-3 py-3">
            <span className="mb-2.5 block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Match stats
            </span>
            <div className="flex flex-col gap-2">
              {statRows.map(({ action, key }) => {
                const meta = matchActionConfig[action];
                return (
                  <div key={action} className="grid grid-cols-[2rem_1fr_2rem] items-center text-xs">
                    <span className="text-left font-bold tabular-nums">{stats.home[key]}</span>
                    <span className="flex items-center justify-center gap-1.5 text-muted-foreground">
                      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClass)} aria-hidden />
                      {meta.label}
                    </span>
                    <span className="text-right font-bold tabular-nums">{stats.away[key]}</span>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
      </div>
    </div>
  );
}
