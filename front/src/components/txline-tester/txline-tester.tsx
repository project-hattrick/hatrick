'use client';

import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleNotch, Clock, ClockCounterClockwise, Pause, Play, Trophy } from '@/components/common/icons';
import { useMatchFeed } from '@/services/realtime/use-match-feed';
import { useReplayCatalog, useStartReplay, useStopReplay, useUpcomingFixtures } from '@/services/queries/use-replay';
import type { ReplayCatalogItem } from '@/services/replay.service';
import type { FixtureDto } from '@/services/txline.service';
import { LiveFeedPanel } from './live-feed-panel';

const SPEEDS = [1, 4, 8, 20, 60];
const fmt = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

type Selected = { fixtureId: number; home: string; away: string; label: string; mode: 'replay' | 'watch' };

export function TxlineTester() {
  const [tab, setTab] = useState<'past' | 'upcoming'>('past');
  const [speed, setSpeed] = useState(8);
  const [selected, setSelected] = useState<Selected | null>(null);

  const catalog = useReplayCatalog(6);
  const upcoming = useUpcomingFixtures();
  const startReplay = useStartReplay();
  const stopReplay = useStopReplay();
  const feed = useMatchFeed(selected?.fixtureId ?? null);

  const replay = (g: ReplayCatalogItem) => {
    feed.reset();
    setSelected({ fixtureId: g.fixtureId, home: g.home, away: g.away, label: `${g.home} v ${g.away}`, mode: 'replay' });
    startReplay.mutate({ fixtureId: g.fixtureId, epochDay: g.epochDay, startHour: g.startHour, speed });
  };
  const watch = (f: FixtureDto) => {
    feed.reset();
    setSelected({ fixtureId: f.FixtureId, home: f.Participant1, away: f.Participant2, label: `${f.Participant1} v ${f.Participant2}`, mode: 'watch' });
  };

  const activeId = selected?.fixtureId;

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:p-6">
      {/* ---- Picker ---- */}
      <Card className="flex h-full flex-col">
        <CardHeader className="space-y-3">
          <div>
            <CardTitle className="text-lg">TxLINE match tester</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Replay a finished match through the live pipeline, or select an upcoming one to watch when it kicks off.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant={tab === 'past' ? 'default' : 'outline'} size="sm" onClick={() => setTab('past')}>
              <ClockCounterClockwise className="size-4" /> Past (replay)
            </Button>
            <Button variant={tab === 'upcoming' ? 'default' : 'outline'} size="sm" onClick={() => setTab('upcoming')}>
              <Clock className="size-4" /> Upcoming
            </Button>
          </div>
          {tab === 'past' ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Speed</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`rounded-md border px-2 py-0.5 font-mono ${
                    speed === s ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="min-h-0 flex-1 overflow-y-auto">
          {tab === 'past' ? (
            <PastList query={catalog} activeId={activeId} pending={startReplay.isPending} onReplay={replay} />
          ) : (
            <UpcomingList query={upcoming} activeId={activeId} onWatch={watch} />
          )}
        </CardContent>

        {selected ? (
          <div className="flex items-center justify-between gap-2 border-t border-border p-3 text-sm">
            <span className="truncate">
              <span className="text-muted-foreground">Selected:</span> {selected.label}
            </span>
            <Button variant="outline" size="sm" onClick={() => stopReplay.mutate()} disabled={stopReplay.isPending}>
              <Pause className="size-4" /> Stop replay
            </Button>
          </div>
        ) : null}
      </Card>

      {/* ---- Live panel ---- */}
      <div className="min-h-[70vh] lg:h-[calc(100vh-3rem)]">
        <LiveFeedPanel
          label={selected?.label ?? null}
          home={selected?.home}
          away={selected?.away}
          mode={selected?.mode ?? 'replay'}
          feed={feed}
        />
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <CircleNotch className="size-4 animate-spin" /> Loading…
    </div>
  );
}

function Row({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
        active ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      {children}
    </div>
  );
}

function PastList({
  query,
  activeId,
  pending,
  onReplay,
}: {
  query: ReturnType<typeof useReplayCatalog>;
  activeId?: number;
  pending: boolean;
  onReplay: (g: ReplayCatalogItem) => void;
}) {
  if (query.isLoading) return <Loading />;
  if (query.isError) return <p className="py-6 text-sm text-red-400">Failed to load catalog.</p>;
  const items = query.data ?? [];
  if (!items.length) return <p className="py-6 text-sm text-muted-foreground">No past matches found.</p>;

  return (
    <div className="space-y-2">
      {items.map((g) => {
        const active = activeId === g.fixtureId;
        return (
          <Row key={g.fixtureId} active={active}>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {g.home} <span className="text-muted-foreground">v</span> {g.away}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Trophy className="size-3.5" /> {g.competition} · {fmt(g.startTime)}
              </div>
            </div>
            <Button size="sm" variant={active ? 'default' : 'outline'} disabled={pending && active} onClick={() => onReplay(g)}>
              {pending && active ? <CircleNotch className="size-4 animate-spin" /> : <Play className="size-4" />}
              Replay
            </Button>
          </Row>
        );
      })}
    </div>
  );
}

function UpcomingList({
  query,
  activeId,
  onWatch,
}: {
  query: ReturnType<typeof useUpcomingFixtures>;
  activeId?: number;
  onWatch: (f: FixtureDto) => void;
}) {
  if (query.isLoading) return <Loading />;
  if (query.isError) return <p className="py-6 text-sm text-red-400">Failed to load fixtures.</p>;
  const items = query.data ?? [];
  if (!items.length) return <p className="py-6 text-sm text-muted-foreground">No upcoming fixtures.</p>;

  return (
    <div className="space-y-2">
      {items.map((f) => {
        const active = activeId === f.FixtureId;
        const soon = f.StartTime - Date.now();
        return (
          <Row key={f.FixtureId} active={active}>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {f.Participant1} <span className="text-muted-foreground">v</span> {f.Participant2}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5" /> {fmt(f.StartTime)}
                {soon > 0 ? <Badge variant="outline">in {Math.round(soon / 3_600_000)}h</Badge> : null}
              </div>
            </div>
            <Button size="sm" variant={active ? 'default' : 'outline'} onClick={() => onWatch(f)}>
              Watch
            </Button>
          </Row>
        );
      })}
    </div>
  );
}
