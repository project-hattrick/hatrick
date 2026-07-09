'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { CircleNotch, Clock, ClockCounterClockwise, Pause, Play, X } from '@/components/common/icons';
import { useReplayCatalog, useUpcomingFixtures } from '@/services/queries/use-replay';
import type { ReplayCatalogItem } from '@/services/replay.service';
import type { FixtureDto } from '@/services/txline.service';

const SPEEDS = [1, 4, 8, 20, 60];
const fmt = (ms: number) => new Date(ms).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

interface MatchPickerProps {
  open: boolean;
  onClose: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  selectedFixtureId: number | null;
  /** True while the selected replay is still being started (spinner on its row). */
  replayPending: boolean;
  onReplay: (game: ReplayCatalogItem) => void;
  onWatch: (fixture: FixtureDto) => void;
  onStop: () => void;
}

/** Shared match-picker drawer for the feed-driven arenas: past replays (with speed) + upcoming fixtures. */
export function MatchPicker({
  open,
  onClose,
  speed,
  onSpeedChange,
  selectedFixtureId,
  replayPending,
  onReplay,
  onWatch,
  onStop,
}: MatchPickerProps) {
  const [tab, setTab] = useState<'past' | 'upcoming'>('past');
  const catalog = useReplayCatalog(6);
  const upcoming = useUpcomingFixtures();

  if (!open) return null;

  return (
    <div className="absolute left-3 top-16 flex max-h-[80vh] w-[min(360px,90vw)] flex-col rounded-xl border border-white/10 bg-black/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 p-3">
        <div className="flex gap-2">
          <Button size="sm" variant={tab === 'past' ? 'default' : 'outline'} onClick={() => setTab('past')}>
            <ClockCounterClockwise className="size-4" /> Past
          </Button>
          <Button size="sm" variant={tab === 'upcoming' ? 'default' : 'outline'} onClick={() => setTab('upcoming')}>
            <Clock className="size-4" /> Upcoming
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {tab === 'past' ? (
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2 text-xs text-white/60">
          <span>Speed</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`rounded border px-2 py-0.5 font-mono ${speed === s ? 'border-sky-400 bg-sky-400/10 text-sky-300' : 'border-white/15'}`}
            >
              {s}×
            </button>
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
        {tab === 'past'
          ? (catalog.isLoading ? <Spinner /> : (catalog.data ?? []).map((g) => (
              <MatchRow
                key={g.fixtureId}
                title={`${g.home} v ${g.away}`}
                sub={`${g.competition} · ${fmt(g.startTime)}`}
                active={selectedFixtureId === g.fixtureId}
                pending={replayPending && selectedFixtureId === g.fixtureId}
                cta="Replay"
                onClick={() => onReplay(g)}
              />
            )))
          : (upcoming.isLoading ? <Spinner /> : (upcoming.data ?? []).map((f) => (
              <MatchRow
                key={f.FixtureId}
                title={`${f.Participant1} v ${f.Participant2}`}
                sub={fmt(f.StartTime)}
                active={selectedFixtureId === f.FixtureId}
                cta="Watch"
                onClick={() => onWatch(f)}
              />
            )))}
      </div>

      {selectedFixtureId != null ? (
        <button
          onClick={onStop}
          className="flex items-center justify-center gap-2 border-t border-white/10 p-2 text-xs text-white/70 hover:text-white"
        >
          <Pause className="size-4" /> Stop replay
        </button>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm text-white/60">
      <CircleNotch className="size-4 animate-spin" /> Loading…
    </div>
  );
}

function MatchRow({
  title,
  sub,
  active,
  pending,
  cta,
  onClick,
}: {
  title: string;
  sub: string;
  active: boolean;
  pending?: boolean;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${
        active ? 'border-sky-400 bg-sky-400/10' : 'border-white/10 hover:bg-white/5'
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-white">{title}</span>
        <span className="block truncate text-xs text-white/50">{sub}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-xs text-sky-300">
        {pending ? <CircleNotch className="size-4 animate-spin" /> : <Play className="size-4" />}
        {cta}
      </span>
    </button>
  );
}
