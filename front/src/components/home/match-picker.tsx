'use client';

import { toast } from 'sonner';

import { Flag } from '@/components/common/flag';
import { CaretDown, CircleNotch, Clock, ClockCounterClockwise, Play } from '@/components/common/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

/** The scoreline (bar) or phase badge (hero) that opens the match menu. */
function PickerTrigger({ variant }: { variant: PickerVariant }) {
  const match = useDisplayMatch();
  const isLive = useIsMatchLive();
  const isReplay = useIsReplay();

  if (variant === 'hero') {
    const phase = lookup(gameStateConfig, match.gameState, gameStateFallback);
    const state = isReplay ? 'REPLAY' : isLive ? 'LIVE' : 'FULL-TIME';
    const detail = isReplay || isLive ? formatMinute(match.minute) : 'ENDED';
    const sub = isLive ? phase.label : null;
    const accent = isReplay ? 'text-neon' : isLive ? 'text-live' : 'text-muted-foreground';
    const dot = isReplay ? 'bg-neon' : isLive ? 'animate-pulse bg-live' : 'bg-muted-foreground';
    return (
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-overlay/45 py-1 pl-3 pr-2.5 backdrop-blur-md transition hover:bg-overlay/60">
        <span className={cn('size-1.5 rounded-full', dot)} />
        <span className={cn('font-mono text-eyebrow font-semibold tracking-wide', accent)}>{state}</span>
        <span className="font-mono text-eyebrow tabular-nums text-muted-foreground">{detail}</span>
        {sub ? (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-mono text-eyebrow text-muted-foreground">{sub}</span>
          </>
        ) : null}
        <CaretDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
    );
  }

  return (
    <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-1.5 py-1 font-mono text-sm font-bold transition hover:bg-white/[0.06]">
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
    </DropdownMenuTrigger>
  );
}

/**
 * Match switcher shared by the seam scorebar (`bar`) and the hero scoreboard (`hero`). The menu
 * lists real upcoming fixtures (/fixtures) and past results (/replay/catalog). Picking a past game
 * loads its authoritative final score from the snapshot (`/fixtures/:id/score`) so the board shows
 * the real result, not 0-0 — the whole landing then reflects that match.
 */
export function MatchPicker({ variant = 'bar' }: { variant?: PickerVariant }) {
  const currentFixtureId = useMatchStore((state) => state.match?.fixtureId);
  const upcoming = useUpcomingFixtures();
  const catalog = useReplayCatalog(6);
  const { loadReplay, isLoadingScore } = useLoadReplay();

  const onLoadResult = (game: ReplayCatalogItem) => {
    void loadReplay(game);
    toast(`${game.home} v ${game.away}`, { description: 'Loading final result…' });
  };

  const onUpcoming = (fixture: FixtureDto) => {
    toast(`${fixture.Participant1} v ${fixture.Participant2}`, {
      description: `Kicks off ${kickoff(fixture.StartTime)}`,
    });
  };

  const past = catalog.data ?? [];
  const next = upcoming.data ?? [];

  return (
    <DropdownMenu>
      <PickerTrigger variant={variant} />

      <DropdownMenuContent align={variant === 'hero' ? 'center' : 'start'} className="max-h-[70vh] w-72 overflow-y-auto">
        <SectionLabel icon={Clock}>Upcoming</SectionLabel>
        {upcoming.isLoading ? (
          <StateRow>Loading fixtures…</StateRow>
        ) : next.length ? (
          next.map((fixture) => (
            <DropdownMenuItem key={fixture.FixtureId} onClick={() => onUpcoming(fixture)}>
              <span className="min-w-0 flex-1">
                <TeamsLine home={fixture.Participant1} away={fixture.Participant2} />
                <span className="block truncate pl-6 text-xs text-muted-foreground">{kickoff(fixture.StartTime)}</span>
              </span>
              <span className="shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-eyebrow font-mono text-muted-foreground">
                Soon
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <StateRow>No upcoming fixtures</StateRow>
        )}

        <DropdownMenuSeparator />

        <SectionLabel icon={ClockCounterClockwise}>Past results</SectionLabel>
        {catalog.isLoading ? (
          <StateRow>Loading results…</StateRow>
        ) : past.length ? (
          past.map((game) => {
            const pending = isLoadingScore && currentFixtureId === game.fixtureId;
            return (
              <DropdownMenuItem key={game.fixtureId} onClick={() => onLoadResult(game)}>
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
              </DropdownMenuItem>
            );
          })
        ) : (
          <StateRow>No past matches</StateRow>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
