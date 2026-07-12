'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Camera, Lightning, Pause, Play, SoccerBall, Target } from '@/components/common/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { REAL_GK_FRANCE_PLAY_CONFIG } from '@/game/realgk/config';
import { createRealGkEngine } from '@/game/realgk/engine';
import { FEEL_TECHNIQUES, SMOOTH_FEEL_PRESET, defaultFeel, type RealGkFeel } from '@/game/realgk/sim/feel';
import type { RealGkHandle } from '@/game/realgk/types';
import { useRealGkStore } from '@/store/real-gk.store';
import {
  DEFAULT_FILTERS,
  ScreenFilterControls,
  ScreenFilterDefs,
  ScreenFilterLayers,
  canvasFilterCss,
  type ScreenFilterState,
} from './screen-filters';

interface FranceArenaProps {
  /** Pin keyboard control to the keeper (full manual GK: move, Q/E dives, throws, punts). */
  keeperControl?: boolean;
}

type DivePackId = 'auto' | 'compact' | 'save' | 'v2';

/** Which dive pack YOUR Q/E plays (and the AI keepers) — 'auto' follows the config feature flags. */
const DIVE_PACKS: { id: DivePackId; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'compact', label: 'Compact' },
  { id: 'save', label: 'Save' },
  { id: 'v2', label: 'V2' },
];

/** Feel-lab toggles come from the shared technique metadata (single source with the comparison grid). */
const FEEL_TOGGLES = FEEL_TECHNIQUES;

export function FranceArena({ keeperControl = false }: FranceArenaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<RealGkHandle | null>(null);
  const [controlLabel, setControlLabel] = useState(keeperControl ? 'Control: Goalkeeper' : 'Control: Player');
  const [divePack, setDivePack] = useState<DivePackId>('auto');
  const [feel, setFeelState] = useState<RealGkFeel>(keeperControl ? SMOOTH_FEEL_PRESET : defaultFeel());
  const [feelOpen, setFeelOpen] = useState(false);
  const [filters, setFilters] = useState<ScreenFilterState>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const patchFilters = (patch: Partial<ScreenFilterState>) => setFilters((prev) => ({ ...prev, ...patch }));

  const applyFeel = (patch: Partial<RealGkFeel>) => {
    setFeelState((prev) => ({ ...prev, ...patch }));
    handleRef.current?.setFeel(patch);
  };
  const setAllFeel = (on: boolean) => {
    const next = { ...defaultFeel() } as RealGkFeel;
    for (const t of FEEL_TOGGLES) next[t.key] = on;
    setFeelState(next);
    handleRef.current?.setFeel(next);
  };

  const scoreBlue = useRealGkStore((s) => s.scoreBlue);
  const scoreRed = useRealGkStore((s) => s.scoreRed);
  const clock = useRealGkStore((s) => s.clock);
  const paused = useRealGkStore((s) => s.paused);
  const speed = useRealGkStore((s) => s.speed);
  const cameraLabel = useRealGkStore((s) => s.cameraLabel);
  const targetLabel = useRealGkStore((s) => s.targetLabel);
  const ballText = useRealGkStore((s) => s.ballText);

  const config = useMemo(
    () =>
      keeperControl
        ? { ...REAL_GK_FRANCE_PLAY_CONFIG, keeperControl: true, feel: SMOOTH_FEEL_PRESET }
        : REAL_GK_FRANCE_PLAY_CONFIG,
    [keeperControl],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createRealGkEngine(canvas, { onHud: useRealGkStore.getState().apply, config });
    handleRef.current = handle;
    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      handle.destroy();
      handleRef.current = null;
    };
  }, [config]);

  return (
    <div ref={containerRef} className="fixed inset-0 select-none overflow-hidden bg-[#06222f]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: 'pixelated', filter: canvasFilterCss(filters), transition: 'filter 0.25s ease' }}
      />
      <ScreenFilterDefs filters={filters} />
      <ScreenFilterLayers filters={filters} />

      <div className="absolute left-3 top-3 z-10">
        <ScreenFilterControls
          filters={filters}
          onChange={patchFilters}
          open={filtersOpen}
          onToggleOpen={() => setFiltersOpen((v) => !v)}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-white/10 bg-black/55 px-5 py-2 backdrop-blur">
          <span className="max-w-[28vw] truncate text-right text-sm font-semibold text-[#5f8fff]">France</span>
          <span className="font-mono text-2xl font-bold tabular-nums text-white">
            {scoreBlue}<span className="mx-1 text-white/40">-</span>{scoreRed}
          </span>
          <span className="max-w-[28vw] truncate text-left text-sm font-semibold text-[#ef4135]">France</span>
          <span className="ml-2 border-l border-white/15 pl-3 font-mono text-xs text-white/70">{clock}</span>
        </div>
        <Badge variant="outline" className="pointer-events-auto border-white/15 bg-black/45 text-white/80">
          <SoccerBall className="mr-1 size-3.5" /> {ballText}
        </Badge>
        {keeperControl ? (
          <Badge variant="outline" className="pointer-events-auto border-[#5f8fff]/40 bg-black/45 text-[#9db9ff]">
            GK CONTROL — WASD move · Q/E dive · Space throw · X punt · C header · V trap · B intercept · F slide
          </Badge>
        ) : null}
      </div>

      <div className="absolute right-3 top-3 flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.togglePause()}>
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          {paused ? 'Play' : 'Pause'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.cycleCamera()}>
          <Camera className="size-4" />
          {cameraLabel.replace('Cam: ', '')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.cycleTarget()}>
          <Target className="size-4" />
          {targetLabel.replace('Follow: ', '')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const next = handleRef.current?.cycleControlledPlayer();
            if (next) setControlLabel(next);
          }}
        >
          <Target className="size-4" />
          {controlLabel.replace('Control: ', '')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.cycleSpeed()}>
          <Lightning className="size-4" />
          {speed}x
        </Button>
      </div>

      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            handleRef.current?.restart();
            setControlLabel(keeperControl ? 'Control: Goalkeeper' : 'Control: Player');
          }}
        >
          Restart
        </Button>
        {keeperControl ? (
          <>
            <Button size="sm" variant="outline" onClick={() => handleRef.current?.keeperDive(-1)}>
              Dive up
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleRef.current?.keeperDive(1)}>
              Dive down
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleRef.current?.debugIncomingShot()}>
              Shot at you
            </Button>
            <div className="flex items-center overflow-hidden rounded-md border border-white/15 bg-black/45">
              <span className="px-2 py-1.5 text-xs text-white/50">Q/E dive:</span>
              {DIVE_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => {
                    handleRef.current?.setKeeperDivePack(pack.id);
                    setDivePack(pack.id);
                  }}
                  className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    divePack === pack.id ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {pack.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.debugAction('receive')}>
          Receive
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.debugAction('powershot')}>
          Power shot
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.debugGoal()}>
          Goal
        </Button>
      </div>

      {keeperControl ? (
        <div className="absolute bottom-3 right-3 w-60 rounded-lg border border-white/10 bg-black/70 backdrop-blur">
          <button
            type="button"
            onClick={() => setFeelOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-white/80"
          >
            <span>Feel lab — transition smoothing</span>
            <span className="text-white/40">{feelOpen ? '▾' : '▸'}</span>
          </button>
          {feelOpen ? (
            <div className="space-y-1.5 px-3 pb-3">
              <div className="mb-1 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setAllFeel(false)}
                  className="flex-1 rounded border border-white/15 px-2 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10"
                >
                  Baseline (all off)
                </button>
                <button
                  type="button"
                  onClick={() => setAllFeel(true)}
                  className="flex-1 rounded border border-white/15 px-2 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10"
                >
                  All on
                </button>
              </div>
              {FEEL_TOGGLES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  title={t.hint}
                  onClick={() => applyFeel({ [t.key]: !feel[t.key] })}
                  className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] transition-colors ${
                    feel[t.key] ? 'bg-[#5f8fff]/25 text-white' : 'text-white/55 hover:bg-white/5'
                  }`}
                >
                  <span>
                    {t.label}
                    {t.exp ? <span className="ml-1 text-[9px] uppercase text-amber-300/70">exp</span> : null}
                  </span>
                  <span
                    className={`ml-2 h-3 w-3 shrink-0 rounded-full border ${
                      feel[t.key] ? 'border-[#5f8fff] bg-[#5f8fff]' : 'border-white/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
