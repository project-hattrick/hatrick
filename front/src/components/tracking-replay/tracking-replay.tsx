'use client';

import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { CircleNotch, Flag, Pause, Play } from '@/components/common/icons';
import { createTrackingPlayer, type TrackingData, type TrackingPlayerHandle } from '@/game/tracking/player';

const HOME = '#38bdf8';
const AWAY = '#fb7185';
const SPEEDS = [1, 2, 4, 8];
const DATA_URL = '/game/tracking/aleague.json';
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function TrackingReplay() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<TrackingPlayerHandle | null>(null);

  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);

  useEffect(() => {
    let alive = true;
    fetch(DATA_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: TrackingData) => alive && setData(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!data || !canvas) return;
    const handle = createTrackingPlayer(canvas, data);
    handleRef.current = handle;
    handle.setSpeed(speed);
    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);

    let raf = 0;
    const poll = () => {
      setCursor(handle.time());
      setPlaying(handle.isPlaying());
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      handle.destroy();
      handleRef.current = null;
    };
    // Recreate only when the dataset changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const duration = data?.duration ?? 0;

  return (
    <div ref={containerRef} className="fixed inset-0 select-none overflow-hidden bg-[#03121a]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'pixelated' }} />

      {/* team banner */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3">
        <div className="flex items-center gap-4 rounded-full border border-white/10 bg-black/55 px-5 py-2 backdrop-blur">
          <span className="text-sm font-semibold" style={{ color: HOME }}>{data?.home ?? 'Home'}</span>
          <span className="font-mono text-xl font-bold text-white">
            {data?.score[0] ?? 0}<span className="mx-1 text-white/40">-</span>{data?.score[1] ?? 0}
          </span>
          <span className="text-sm font-semibold" style={{ color: AWAY }}>{data?.away ?? 'Away'}</span>
          <Badge variant="outline" className="ml-1 border-white/20 text-white/60">real tracking</Badge>
        </div>
      </div>

      {(!data || error) && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
          {error ? (
            <span className="text-red-400">Failed to load tracking: {error}</span>
          ) : (
            <span className="flex items-center gap-2"><CircleNotch className="size-5 animate-spin" /> Loading tracking…</span>
          )}
        </div>
      )}

      {/* transport bar */}
      {data ? (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8">
          {/* timeline + markers */}
          <div className="relative">
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={cursor}
              onChange={(e) => {
                const t = Number(e.target.value);
                handleRef.current?.seek(t);
                setCursor(t);
              }}
              className="w-full accent-sky-400"
            />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0">
              {data.keyMoments.map((m) => (
                <button
                  key={m.t}
                  title={`${fmt(m.t)} · ${m.label}`}
                  onClick={() => {
                    handleRef.current?.seek(m.t);
                    setCursor(m.t);
                  }}
                  className="pointer-events-auto absolute -top-2 size-2 -translate-x-1/2 rounded-full bg-amber-400 hover:scale-150"
                  style={{ left: `${(m.t / duration) * 100}%` }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRef.current?.toggle()}
              className="flex size-9 items-center justify-center rounded-full bg-sky-500 text-black hover:bg-sky-400"
            >
              {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
            <span className="font-mono text-xs text-white/80">
              {fmt(cursor)} <span className="text-white/40">/ {fmt(duration)}</span>
            </span>

            <div className="ml-2 flex items-center gap-1 text-xs text-white/60">
              <span>speed</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    handleRef.current?.setSpeed(s);
                    setSpeed(s);
                  }}
                  className={`rounded border px-2 py-0.5 font-mono ${speed === s ? 'border-sky-400 bg-sky-400/10 text-sky-300' : 'border-white/15'}`}
                >
                  {s}×
                </button>
              ))}
            </div>

            <span className="ml-auto flex items-center gap-1 text-xs text-white/50">
              <Flag className="size-3.5 text-amber-400" /> {data.keyMoments.length} moments — click a marker to jump
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
