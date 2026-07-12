'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Popover } from '@base-ui/react/popover';

import { Flag } from '@/components/common/flag';
import { CaretDown, CaretRight, CircleNotch, Clock, ClockCounterClockwise, Lock, MagnifyingGlass, Play, ShieldCheck } from '@/components/common/icons';
import { useReplayCatalog, useUpcomingFixtures } from '@/services/queries/use-replay';
import { useCreateRoom } from '@/services/queries';
import type { ReplayCatalogItem } from '@/services/replay.service';
import type { FixtureDto } from '@/services/txline.service';
import { useDisplayMatch, useIsMatchLive, useIsReplay, useIsSwitching, useMatchStore } from '@/store/match.store';
import { useLoadReplay } from '@/hooks/use-load-replay';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { useKickoffCountdown } from '@/hooks/use-kickoff-countdown';
import { useLiveMinute } from '@/hooks/use-live-minute';
import { fixtureToReplayItem } from '@/lib/fixture-replay';
import { teamInfoFromName } from '@/config/teams.config';
import { gameStateConfig, gameStateFallback } from '@/config/game-state.config';
import { TeamSide } from '@/enums/team-side.enum';
import { fifaToIso } from '@/lib/country';
import { formatMinute } from '@/lib/format';
import { lookup } from '@/lib/lookup';
import { cn } from '@/lib/utils';

type PickerVariant = 'bar' | 'hero';

const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;
const toMs = (value: number) => (value < 1e12 ? value * 1000 : value);
const kickoff = (ms: number) =>
  new Date(toMs(ms)).toLocaleString('en', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
const pad = (value: number) => String(value).padStart(2, '0');

function countdownLabel(targetMs: number, now: number): string {
  const total = Math.max(0, Math.ceil((targetMs - now) / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${pad(hours)}h`;
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function elapsedLabel(startMs: number, now: number): string {
  const minutes = Math.max(0, Math.floor((now - startMs) / 60_000));
  if (minutes < 60) return `${minutes}m in`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m in`;
}

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

function FeaturedFixtureCard({
  fixture,
  live,
  now,
  onClick,
}: {
  fixture: FixtureDto;
  live: boolean;
  now: number;
  onClick: () => void;
}) {
  const startMs = toMs(fixture.StartTime);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mt-2 flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition',
        live
          ? 'border-live/45 bg-live/10 hover:bg-live/15'
          : 'border-neon/35 bg-neon/10 hover:bg-neon/15',
      )}
    >
      <span className="min-w-0 flex-1">
        <TeamsLine home={fixture.Participant1} away={fixture.Participant2} />
        <span className="mt-0.5 block truncate pl-6 text-xs text-muted-foreground">
          {live ? elapsedLabel(startMs, now) : kickoff(startMs)}
        </span>
      </span>
      <span
        className={cn(
          'grid min-w-10 shrink-0 place-items-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none tabular-nums',
          live ? 'border-live/50 bg-live/10 text-live' : 'border-neon/50 bg-neon/10 text-neon',
        )}
      >
        {live ? 'Live' : countdownLabel(startMs, now)}
      </span>
    </button>
  );
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
function PickerTrigger({ variant, disabled = false }: { variant: PickerVariant; disabled?: boolean }) {
  const match = useDisplayMatch();
  const isLive = useIsMatchLive();
  const isReplay = useIsReplay();
  const switching = useIsSwitching();
  const countdown = useKickoffCountdown();
  const liveMinute = useLiveMinute();

  if (variant === 'hero') {
    const phase = lookup(gameStateConfig, match.gameState, gameStateFallback);
    // A picked past match streams through the live pipeline but is NOT live — it reads honestly as "Replay".
    const replay = isReplay;
    const live = isLive && !replay;
    const state = switching ? 'Loading' : countdown ? 'Kickoff' : replay ? 'Replay' : isLive ? 'Live' : 'Full-time';
    // Pre-kickoff shows only the "Kickoff" state here — the big scoreboard number owns the countdown.
    const detail = switching ? null : countdown ? null : replay || live ? formatMinute(liveMinute) : null;
    const sub = switching || countdown !== null || (!live && !replay) ? null : phase.label;
    const accent = countdown ? 'text-neon' : replay ? 'text-neon' : live ? 'text-live' : 'text-muted-foreground';
    const dot = countdown ? 'animate-pulse bg-neon' : live ? 'animate-pulse bg-live' : 'bg-muted-foreground';
    return (
      <Popover.Trigger
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-overlay/45 py-1 pl-2.5 pr-2 backdrop-blur-md transition hover:bg-overlay/60 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-overlay/45"
      >
        {switching ? (
          <CircleNotch className="size-3 animate-spin text-neon" />
        ) : replay ? (
          <ClockCounterClockwise className="size-3 text-neon" />
        ) : (
          <span className={cn('size-1.5 rounded-full', dot)} />
        )}
        <span className={cn('text-[11px] font-semibold', switching ? 'text-neon' : accent)}>{state}</span>
        {detail ? <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{detail}</span> : null}
        {sub ? <span className="text-[11px] text-muted-foreground">· {sub}</span> : null}
        {disabled ? <Lock className="size-3 text-muted-foreground" /> : <CaretDown className="size-3 text-muted-foreground" />}
      </Popover.Trigger>
    );
  }

  return (
    <Popover.Trigger
      disabled={disabled}
      className="flex items-center gap-2 rounded-md px-1.5 py-1 font-mono text-sm font-bold transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-transparent"
    >
      <Flag code={fifaToIso(match.home.code)} className="text-base" />
      <span className="hidden sm:inline">{match.home.code}</span>
      <span className="tabular-nums">
        {match.score.home}
        <span className="mx-1.5 text-muted-foreground">×</span>
        {match.score.away}
      </span>
      <span className="hidden sm:inline">{match.away.code}</span>
      <Flag code={fifaToIso(match.away.code)} className="text-base" />
      {switching ? (
        <CircleNotch className="size-3.5 animate-spin text-neon" />
      ) : (
        disabled ? (
          <Lock className="size-3.5 text-muted-foreground" />
        ) : (
          <CaretDown className="size-3.5 text-muted-foreground" />
        )
      )}
    </Popover.Trigger>
  );
}

/**
 * Match switcher shared by the seam scorebar (`bar`) and the hero scoreboard (`hero`). A Popover (not a
 * menu) so a search field + a plain, wheel-scrollable list live inside without fighting menu typeahead.
 * Lists real upcoming fixtures (/fixtures) and past results (/replay/catalog); picking a past game streams
 * it back through the live pipeline so the whole landing reflects that match.
 */
export function MatchPicker({ variant = 'bar', disabled = false }: { variant?: PickerVariant; disabled?: boolean }) {
  const currentFixtureId = useMatchStore((state) => state.match?.fixtureId);
  const upcoming = useUpcomingFixtures();
  const catalog = useReplayCatalog(6);
  const { loadReplay, isLoadingScore } = useLoadReplay();
  const createRoom = useCreateRoom();
  const gate = useAuthGate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

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
    void loadReplay(fixtureToReplayItem(fixture));
    toast(`${fixture.Participant1} v ${fixture.Participant2}`, { description: 'Loading match…' });
    setOpen(false);
  };

  // Spin up an invite-only room over whatever match is on screen, then route the host into it — the
  // "watch this privately" shortcut that lives right where you pick what to watch (auth-gated).
  const onCreatePrivateRoom = gate(() => {
    setOpen(false);
    createRoom.mutate(currentFixtureId != null ? { fixtureId: currentFixtureId } : {});
  });

  const q = query.trim().toLowerCase();
  const hit = (a: string, b: string) => !q || `${a} ${b}`.toLowerCase().includes(q);
  const sortedFixtures = useMemo(
    () => [...(upcoming.data ?? [])].sort((a, b) => toMs(a.StartTime) - toMs(b.StartTime)),
    [upcoming.data],
  );
  const past = (catalog.data ?? []).filter((g) => hit(g.home, g.away));
  const next = sortedFixtures.filter((f) => hit(f.Participant1, f.Participant2));
  const liveFixture = sortedFixtures.find((fixture) => {
    const startMs = toMs(fixture.StartTime);
    return startMs <= now && now - startMs <= LIVE_WINDOW_MS;
  });
  const nextFixture = sortedFixtures.find((fixture) => toMs(fixture.StartTime) > now);
  const featuredFixture = liveFixture ?? nextFixture;

  return (
    <Popover.Root open={disabled ? false : open} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
      <PickerTrigger variant={variant} disabled={disabled} />

      <Popover.Portal>
        <Popover.Positioner sideOffset={10} align={variant === 'hero' ? 'center' : 'start'} className="z-50">
          <Popover.Popup className="flex max-h-[70vh] w-80 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[20px] border border-white/10 bg-surface-1/95 p-2 text-sm text-foreground shadow-2xl backdrop-blur-2xl outline-none origin-[var(--transform-origin)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            {/* Primary action: take whatever match is on into an invite-only room to watch with friends. */}
            <button
              type="button"
              onClick={onCreatePrivateRoom}
              disabled={createRoom.isPending}
              className="group mb-2 flex w-full shrink-0 items-center gap-2.5 rounded-xl border border-neon/35 bg-neon/10 px-2.5 py-2 text-left transition hover:border-neon/55 hover:bg-neon/[0.16] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-neon/15 text-neon">
                {createRoom.isPending ? (
                  <CircleNotch className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" weight="fill" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-foreground">
                  {createRoom.isPending ? 'Creating room…' : 'Watch in a private room'}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  Invite-only · watch, predict &amp; chat with friends
                </span>
              </span>
              <CaretRight className="size-4 shrink-0 text-neon transition group-hover:translate-x-0.5" />
            </button>

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

            {featuredFixture ? (
              <FeaturedFixtureCard
                fixture={featuredFixture}
                live={featuredFixture.FixtureId === liveFixture?.FixtureId}
                now={now}
                onClick={() => onUpcoming(featuredFixture)}
              />
            ) : null}

            {/* data-lenis-prevent: the ReactLenis root owns the page wheel — without it the list never scrolls,
                the page does. overscroll-contain stops the scroll from chaining to the page at the edges. */}
            <div
              data-lenis-prevent
              className="custom-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
            >
              <SectionLabel icon={Clock}>Upcoming</SectionLabel>
              {upcoming.isLoading ? (
                <StateRow>Loading fixtures…</StateRow>
              ) : next.length ? (
                next.map((fixture) => {
                  const startMs = toMs(fixture.StartTime);
                  const live = startMs <= now && now - startMs <= LIVE_WINDOW_MS;
                  const featured = fixture.FixtureId === featuredFixture?.FixtureId;
                  return (
                    <MatchRow key={fixture.FixtureId} onClick={() => onUpcoming(fixture)}>
                      <span className="min-w-0 flex-1">
                        <TeamsLine home={fixture.Participant1} away={fixture.Participant2} />
                        <span className="block truncate pl-6 text-xs text-muted-foreground">{kickoff(fixture.StartTime)}</span>
                      </span>
                      <span
                        className={cn(
                          'grid min-w-10 shrink-0 place-items-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none',
                          live
                            ? 'border-live/50 bg-live/10 text-live'
                            : featured
                              ? 'border-neon/50 bg-neon/10 text-neon'
                              : 'border-border/60 text-muted-foreground',
                        )}
                      >
                        {live ? 'Live' : featured ? countdownLabel(startMs, now) : 'Soon'}
                      </span>
                    </MatchRow>
                  );
                })
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
