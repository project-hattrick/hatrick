'use client';

import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Broadcast, CircleNotch, Clock, ClockCounterClockwise, List, Pause, Play, X } from '@/components/common/icons';
import { createHeadsOnlyEngine, type HeadsOnlyHandle } from '@/game/headsonly/engine';
import { useMatchFeed } from '@/services/realtime/use-match-feed';
import { useHeadsDriver } from '@/services/realtime/use-heads-driver';
import { useReplayCatalog, useStartReplay, useStopReplay, useUpcomingFixtures } from '@/services/queries/use-replay';
import type { ReplayCatalogItem } from '@/services/replay.service';
import type { FixtureDto } from '@/services/txline.service';

const HOME = '#38bdf8';
const AWAY = '#fb7185';
const SPEEDS = [4, 8, 20, 60];
const THREAT_VAL: Record<string, number> = { Safe: 0.2, Attack: 0.5, Danger: 0.78, HighDanger: 1 };
const fmt = (ms: number) => new Date(ms).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

type Selected = { fixtureId: number; home: string; away: string; mode: 'replay' | 'watch' };

export function HeadsArena() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<HeadsOnlyHandle | null>(null);

  const [selected, setSelected] = useState<Selected | null>(null);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [tab, setTab] = useState<'past' | 'upcoming'>('past');
  const [speed, setSpeed] = useState(8);

  const catalog = useReplayCatalog(6);
  const upcoming = useUpcomingFixtures();
  const startReplay = useStartReplay();
  const stopReplay = useStopReplay();
  const feed = useMatchFeed(selected?.fixtureId ?? null);
  useHeadsDriver(handleRef, selected?.fixtureId ?? null);

  // Mount the engine once (autonomous "attract mode" until a match is picked).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createHeadsOnlyEngine(canvas);
    handleRef.current = handle;
    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      handle.destroy();
      handleRef.current = null;
    };
  }, []);

  const pick = (s: Selected, replayInput?: { epochDay: number; startHour: number }) => {
    feed.reset();
    handleRef.current?.setDriven(true); // reset to 0-0 kickoff and hand control to the feed
    setSelected(s);
    setPickerOpen(false);
    if (replayInput) startReplay.mutate({ fixtureId: s.fixtureId, ...replayInput, speed });
  };
  const onReplay = (g: ReplayCatalogItem) =>
    pick({ fixtureId: g.fixtureId, home: g.home, away: g.away, mode: 'replay' }, { epochDay: g.epochDay, startHour: g.startHour });
  const onWatch = (f: FixtureDto) =>
    pick({ fixtureId: f.FixtureId, home: f.Participant1, away: f.Participant2, mode: 'watch' });

  const last = feed.events[0];
  const attackingSide = last?.participant === 1 ? 'home' : last?.participant === 2 ? 'away' : null;
  const threat = last?.possessionType ? THREAT_VAL[last.possessionType] ?? 0 : 0;
  const buffering = !!selected && feed.events.length === 0;

  return (
    <div ref={containerRef} className="fixed inset-0 select-none overflow-hidden bg-[#03121a]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} />

      {/* ---- Top HUD ---- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-white/10 bg-black/55 px-5 py-2 backdrop-blur">
          <span className="max-w-[28vw] truncate text-right text-sm font-semibold" style={{ color: HOME }}>
            {selected?.home ?? 'Home'}
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums text-white">
            {feed.score.home}<span className="mx-1 text-white/40">-</span>{feed.score.away}
          </span>
          <span className="max-w-[28vw] truncate text-left text-sm font-semibold" style={{ color: AWAY }}>
            {selected?.away ?? 'Away'}
          </span>
          <span className="ml-2 border-l border-white/15 pl-3 font-mono text-xs text-white/70">
            {feed.minute != null ? `${feed.minute}'` : selected ? '—' : 'idle'}
          </span>
        </div>

        {/* threat / possession bar */}
        {selected ? (
          <div className="pointer-events-none flex w-[min(520px,80vw)] items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round(threat * 100)}%`,
                  marginLeft: attackingSide === 'away' ? `${Math.round((1 - threat) * 100)}%` : 0,
                  background: attackingSide === 'away' ? AWAY : HOME,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* ---- WS status + controls (top-right) ---- */}
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <Badge variant="outline" className={feed.connected ? 'border-emerald-500/40 text-emerald-400' : 'border-red-500/40 text-red-400'}>
          <Broadcast className="mr-1 size-3.5" /> {feed.connected ? 'live' : 'offline'}
        </Badge>
        <Button size="sm" variant="outline" onClick={() => setPickerOpen((v) => !v)}>
          <List className="size-4" /> Matches
        </Button>
      </div>

      {/* ---- last event + buffering ---- */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 text-xs text-white/70">
        {buffering ? (
          <span className="flex items-center gap-2 rounded-md bg-black/50 px-3 py-1.5">
            <CircleNotch className="size-4 animate-spin" />
            {selected?.mode === 'replay' ? 'Buffering replay… (~20–30s)' : 'Waiting for kickoff…'}
          </span>
        ) : last ? (
          <span className="rounded-md bg-black/50 px-3 py-1.5">
            {last.minute != null ? `${last.minute}' ` : ''}
            {last.rawAction ?? last.action}
            {last.possessionType && last.possessionType !== 'Safe' ? ` · ${last.possessionType}` : ''}
          </span>
        ) : null}
      </div>

      {/* ---- Match picker drawer ---- */}
      {pickerOpen ? (
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
            <Button size="sm" variant="ghost" onClick={() => setPickerOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>

          {tab === 'past' ? (
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2 text-xs text-white/60">
              <span>Speed</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
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
                    active={selected?.fixtureId === g.fixtureId}
                    pending={startReplay.isPending && selected?.fixtureId === g.fixtureId}
                    cta="Replay"
                    onClick={() => onReplay(g)}
                  />
                )))
              : (upcoming.isLoading ? <Spinner /> : (upcoming.data ?? []).map((f) => (
                  <MatchRow
                    key={f.FixtureId}
                    title={`${f.Participant1} v ${f.Participant2}`}
                    sub={fmt(f.StartTime)}
                    active={selected?.fixtureId === f.FixtureId}
                    cta="Watch"
                    onClick={() => onWatch(f)}
                  />
                )))}
          </div>

          {selected ? (
            <button
              onClick={() => stopReplay.mutate()}
              className="flex items-center justify-center gap-2 border-t border-white/10 p-2 text-xs text-white/70 hover:text-white"
            >
              <Pause className="size-4" /> Stop replay
            </button>
          ) : null}
        </div>
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
