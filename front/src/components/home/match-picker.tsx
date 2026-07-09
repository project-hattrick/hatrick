'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Popover } from '@base-ui/react/popover';

import { Flag } from '@/components/common/flag';
import { CaretDown, CircleNotch, Clock, ClockCounterClockwise, MagnifyingGlass, Play } from '@/components/common/icons';
import { useReplayCatalog, useUpcomingFixtures } from '@/services/queries/use-replay';
import type { ReplayCatalogItem } from '@/services/replay.service';
import type { FixtureDto } from '@/services/txline.service';
import { useDisplayMatch, useIsMatchLive, useIsReplay, useMatchStore } from '@/store/match.store';
import { useLoadReplay } from '@/hooks/use-load-replay';
import { teamInfoFromName } from '@/config/teams.config';
import { gameStateConfig, gameStateFallback } from '@/config/game-state.config';
import { TeamSide } from '@/enums/team-side.enum';
import { fifaToIso } from '@/lib/country';
import { formatMinute } from '@/lib/format';
import { lookup } from '@/lib/lookup';
import { cn } from '@/lib/utils';

type PickerVariant = 'bar' | 'hero';

const kickoff = (ms: number) =>
  new Date(ms).toLocaleString('en', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

const codeFor = (name: string) => teamInfoFromName(name, TeamSide.Home).code;

function TeamsLine({ home, away }: { home: string; away: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 font-medium">
      <Flag code={fifaToIso(codeFor(home))} className="shrink-0 text-sm" />
      <span className="truncate">{home}</span>
      <span className="shrink-0 text-muted-foreground">v</span>
      <Flag code={fifaToIso(codeFor(away))} className="shrink-0 text-sm" />
      <span className="truncate">{away}</span>
    </span>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: typeof Clock; children: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 pb-1 pt-1.5 text-eyebrow font-mono uppercase tracking-wide text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </div>
  );
}

function StateRow({ children }: { children: string }) {
  return <div className="px-2.5 py-3 text-center text-xs text-muted-foreground">{children}</div>;
}

/** A tappable match row (upcoming or past) — shares the menu-item look, but a plain button so wheel-scroll works. */
function MatchRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer select-none items-center gap-2 rounded-xl px-2.5 py-2 text-left outline-none transition hover:bg-white/[0.06]"
    >
      {children}
    </button>
  );
}

/** The scoreline (bar) or phase badge (hero) that opens the match menu. */
function PickerTrigger({ variant }: { variant: PickerVariant }) {
  const match = useDisplayMatch();
  const isLive = useIsMatchLive();
  const isReplay = useIsReplay();

  if (variant === 'hero') {
    const phase = lookup(gameStateConfig, match.gameState, gameStateFallback);
    const state = isReplay ? 'Replay' : isLive ? 'Live' : 'Full-time';
    const detail = isReplay || isLive ? formatMinute(match.minute) : null;
    const sub = isLive ? phase.label : null;
    const accent = isReplay ? 'text-neon' : isLive ? 'text-live' : 'text-muted-foreground';
    const dot = isReplay ? 'bg-neon' : isLive ? 'animate-pulse bg-live' : 'bg-muted-foreground';
    return (
      <Popover.Trigger className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-overlay/45 py-1 pl-2.5 pr-2 backdrop-blur-md transition hover:bg-overlay/60">
        <span className={cn('size-1.5 rounded-full', dot)} />
        <span className={cn('text-[11px] font-semibold', accent)}>{state}</span>
        {detail ? <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{detail}</span> : null}
        {sub ? <span className="text-[11px] text-muted-foreground">· {sub}</span> : null}
        <CaretDown className="size-3 text-muted-foreground" />
      </Popover.Trigger>
    );
  }

  return (
    <Popover.Trigger className="flex items-center gap-2 rounded-md px-1.5 py-1 font-mono text-sm font-bold transition hover:bg-white/[0.06]">
      <Flag code={fifaToIso(match.home.code)} className="text-base" />
      <span className="hidden sm:inline">{match.home.code}</span>
      <span className="tabular-nums">
        {match.score.home}
        <span className="mx-1.5 text-muted-foreground">×</span>
        {match.score.away}
      </span>
      <span className="hidden sm:inline">{match.away.code}</span>
      <Flag code={fifaToIso(match.away.code)} className="text-base" />
      <CaretDown className="size-3.5 text-muted-foreground" />
    </Popover.Trigger>
  );
}

/**
 * Match switcher shared by the seam scorebar (`bar`) and the hero scoreboard (`hero`). A Popover (not a
 * menu) so a search field + a plain, wheel-scrollable list live inside without fighting menu typeahead.
 * Lists real upcoming fixtures (/fixtures) and past results (/replay/catalog); picking a past game streams
 * it back through the live pipeline so the whole landing reflects that match.
 */
export function MatchPicker({ variant = 'bar' }: { variant?: PickerVariant }) {
  const currentFixtureId = useMatchStore((state) => state.match?.fixtureId);
  const upcoming = useUpcomingFixtures();
  const catalog = useReplayCatalog(6);
  const { loadReplay, isLoadingScore } = useLoadReplay();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Focus the search WITHOUT scrolling the page to it (default focus would jump the whole view to the top).
  const focusNoScroll = useCallback((el: HTMLInputElement | null) => {
    el?.focus({ preventScroll: true });
  }, []);

  const onLoadResult = (game: ReplayCatalogItem) => {
    void loadReplay(game);
    toast(`${game.home} v ${game.away}`, { description: 'Loading match…' });
    setOpen(false);
  };

  // Live / upcoming fixtures stream through the same pipeline: a live or already-started game plays back
  // through the feed; a truly future one simply has no events yet (buffers until kickoff).
  const onUpcoming = (fixture: FixtureDto) => {
    const ms = fixture.StartTime < 1e12 ? fixture.StartTime * 1000 : fixture.StartTime;
    void loadReplay({
      fixtureId: fixture.FixtureId,
      home: fixture.Participant1,
      away: fixture.Participant2,
      competition: '',
      startTime: ms,
      epochDay: Math.floor(ms / 86_400_000),
      startHour: new Date(ms).getUTCHours(),
    });
    toast(`${fixture.Participant1} v ${fixture.Participant2}`, { description: 'Loading match…' });
    setOpen(false);
  };

  const q = query.trim().toLowerCase();
  const hit = (a: string, b: string) => !q || `${a} ${b}`.toLowerCase().includes(q);
  const past = (catalog.data ?? []).filter((g) => hit(g.home, g.away));
  const next = (upcoming.data ?? []).filter((f) => hit(f.Participant1, f.Participant2));

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <PickerTrigger variant={variant} />

      <Popover.Portal>
        <Popover.Positioner sideOffset={10} align={variant === 'hero' ? 'center' : 'start'} className="z-50">
          <Popover.Popup className="flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-[20px] border border-white/10 bg-surface-1/95 p-2 text-sm text-foreground shadow-2xl backdrop-blur-2xl outline-none origin-[var(--transform-origin)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2">
              <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={focusNoScroll}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search matches or teams…"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
              <SectionLabel icon={Clock}>Upcoming</SectionLabel>
              {upcoming.isLoading ? (
                <StateRow>Loading fixtures…</StateRow>
              ) : next.length ? (
                next.map((fixture) => (
                  <MatchRow key={fixture.FixtureId} onClick={() => onUpcoming(fixture)}>
                    <span className="min-w-0 flex-1">
                      <TeamsLine home={fixture.Participant1} away={fixture.Participant2} />
                      <span className="block truncate pl-6 text-xs text-muted-foreground">{kickoff(fixture.StartTime)}</span>
                    </span>
                    <span className="shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-eyebrow font-mono text-muted-foreground">
                      Soon
                    </span>
                  </MatchRow>
                ))
              ) : (
                <StateRow>{q ? 'No matches found' : 'No upcoming fixtures'}</StateRow>
              )}

              <div className="-mx-2 my-2 h-px bg-white/10" />

              <SectionLabel icon={ClockCounterClockwise}>Past results</SectionLabel>
              {catalog.isLoading ? (
                <StateRow>Loading results…</StateRow>
              ) : past.length ? (
                past.map((game) => {
                  const pending = isLoadingScore && currentFixtureId === game.fixtureId;
                  return (
                    <MatchRow key={game.fixtureId} onClick={() => onLoadResult(game)}>
                      <span className="min-w-0 flex-1">
                        <TeamsLine home={game.home} away={game.away} />
                        <span className="block truncate pl-6 text-xs text-muted-foreground">
                          {game.competition} · {kickoff(game.startTime)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-neon">
                        {pending ? <CircleNotch className="size-4 animate-spin" /> : <Play className="size-4" />}
                        View
                      </span>
                    </MatchRow>
                  );
                })
              ) : (
                <StateRow>{q ? 'No matches found' : 'No past matches'}</StateRow>
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
