'use client';

import { useState } from 'react';

import { GlassPanel } from '@/components/common/glass-panel';
import { Broadcast } from '@/components/common/icons';
import { Flag } from '@/components/common/flag';
import { fifaToIso } from '@/lib/country';
import { useMatch } from '@/store/match.store';
import { featuredLiveMatch, liveRailMatches, type LiveScoreMatch } from '@/config/home.config';
import { cn } from '@/lib/utils';

// The live games the viewer can jump between (featured + rail), in switch order.
const MATCHES: LiveScoreMatch[] = [featuredLiveMatch, ...liveRailMatches];

function MatchRow({
  match,
  selected,
  watching,
  onSelect,
}: {
  match: LiveScoreMatch;
  selected: boolean;
  watching: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition',
        selected ? 'border-neon/40 bg-neon/5' : 'border-white/10 bg-foreground/[0.02] hover:bg-foreground/5',
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-live tabular-nums">
        <span className="size-1.5 animate-pulse rounded-full bg-live" />
        {match.minute}&apos;
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <Flag code={fifaToIso(match.home.code)} className="text-base" />
        <span className="text-sm font-bold">{match.home.code}</span>
        <span className="font-mono text-sm font-bold tabular-nums">
          {match.homeScore}–{match.awayScore}
        </span>
        <span className="text-sm font-bold">{match.away.code}</span>
        <Flag code={fifaToIso(match.away.code)} className="text-base" />
      </span>
      {watching ? (
        <span className="text-eyebrow shrink-0 rounded-full bg-neon/15 px-2 py-0.5 font-mono text-neon">
          Watching
        </span>
      ) : null}
    </button>
  );
}

/** Split-view game switcher — pick which live match to watch; the on-stage feed is the default pick. */
export function MatchSelector() {
  const current = useMatch();

  // Whatever the live feed is streaming is the game currently on the stage.
  const watchingId =
    (current &&
      MATCHES.find((m) => m.home.code === current.home.code && m.away.code === current.away.code)?.id) ??
    MATCHES[0].id;

  const [selectedId, setSelectedId] = useState(watchingId);

  return (
    <GlassPanel tone="dark" radius="xl" className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold tracking-wide">
          <Broadcast className="size-4 text-neon" />
          Live matches
        </span>
        <span className="text-eyebrow font-mono text-muted-foreground">
          {MATCHES.length} live
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {MATCHES.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            selected={match.id === selectedId}
            watching={match.id === watchingId}
            onSelect={() => setSelectedId(match.id)}
          />
        ))}
      </div>
    </GlassPanel>
  );
}
