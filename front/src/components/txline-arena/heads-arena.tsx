'use client';

import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Broadcast, CircleNotch, List } from '@/components/common/icons';
import { createHeadsOnlyEngine, type HeadsOnlyHandle } from '@/game/headsonly/engine';
import { useMatchFeed } from '@/services/realtime/use-match-feed';
import { useHeadsDriver } from '@/services/realtime/use-heads-driver';
import { useStartReplay, useStopReplay } from '@/services/queries/use-replay';
import type { ReplayCatalogItem } from '@/services/replay.service';
import type { FixtureDto } from '@/services/txline.service';
import { MatchPicker } from './match-picker';

const HOME = '#38bdf8';
const AWAY = '#fb7185';
const THREAT_VAL: Record<string, number> = { Safe: 0.2, Attack: 0.5, Danger: 0.78, HighDanger: 1 };

type Selected = { fixtureId: number; home: string; away: string; mode: 'replay' | 'watch' };

export function HeadsArena() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<HeadsOnlyHandle | null>(null);

  const [selected, setSelected] = useState<Selected | null>(null);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [speed, setSpeed] = useState(8);

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
            {feed.matchEnd ? 'FT' : feed.halfTime ? 'HT' : feed.minute != null ? `${feed.minute}'` : selected ? '—' : 'idle'}
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

      <MatchPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        speed={speed}
        onSpeedChange={setSpeed}
        selectedFixtureId={selected?.fixtureId ?? null}
        replayPending={startReplay.isPending}
        onReplay={onReplay}
        onWatch={onWatch}
        onStop={() => stopReplay.mutate()}
      />
    </div>
  );
}
