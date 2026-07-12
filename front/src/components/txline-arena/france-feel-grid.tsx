'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { REAL_GK_FRANCE_PLAY_CONFIG } from '@/game/realgk/config';
import { createRealGkEngine } from '@/game/realgk/engine';
import { FEEL_TECHNIQUES, allFeelOn, defaultFeel, type RealGkFeel } from '@/game/realgk/sim/feel';
import type { RealGkHandle } from '@/game/realgk/types';
import {
  DEFAULT_FILTERS,
  ScreenFilterControls,
  ScreenFilterDefs,
  ScreenFilterLayers,
  canvasFilterCss,
  type ScreenFilterState,
} from './screen-filters';

interface FeelVariant {
  id: string;
  label: string;
  hint: string;
  feel: RealGkFeel;
  exp?: boolean;
}

/** Baseline (all off) → each technique in isolation → All on. Same match in every cell, only feel differs. */
const VARIANTS: FeelVariant[] = [
  { id: 'baseline', label: 'Baseline', hint: 'todas OFF — o comportamento cru atual', feel: defaultFeel() },
  ...FEEL_TECHNIQUES.map((t) => ({
    id: t.key,
    label: t.label,
    hint: t.hint,
    exp: t.exp,
    feel: { ...defaultFeel(), [t.key]: true } as RealGkFeel,
  })),
  { id: 'all', label: 'All on', hint: 'todas as técnicas combinadas', feel: allFeelOn() },
];

const FIRE_CADENCE_MS = 3600;

/** One live sim cell running the France keeper on autopilot with a single feel variant applied. */
function FeelCell({
  variant,
  index,
  register,
  filters,
}: {
  variant: FeelVariant;
  index: number;
  register: (index: number, handle: RealGkHandle | null) => void;
  filters: ScreenFilterState;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const config = useMemo(
    () => ({ ...REAL_GK_FRANCE_PLAY_CONFIG, keeperControl: true, keeperAutopilot: true, feel: variant.feel }),
    [variant],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createRealGkEngine(canvas, { onHud: () => {}, config });
    register(index, handle);
    const observer = new ResizeObserver(() => handle.resize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      handle.destroy();
      register(index, null);
    };
  }, [config, index, register]);

  return (
    <div ref={containerRef} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-[#06222f]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: 'pixelated', filter: canvasFilterCss(filters), transition: 'filter 0.25s ease' }}
      />
      <ScreenFilterLayers filters={filters} />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            {variant.label}
            {variant.exp ? <span className="text-[9px] uppercase text-amber-300/80">exp</span> : null}
          </div>
          <div className="mt-0.5 max-w-[92%] text-[10px] leading-tight text-white/55">{variant.hint}</div>
        </div>
        <span className="shrink-0 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-white/40">#{index}</span>
      </div>
    </div>
  );
}

export function FranceFeelGrid() {
  const handles = useRef<Map<number, RealGkHandle>>(new Map());
  const [running, setRunning] = useState(true);
  const [paused, setPaused] = useState(false);
  const [filters, setFilters] = useState<ScreenFilterState>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const patchFilters = (patch: Partial<ScreenFilterState>) => setFilters((prev) => ({ ...prev, ...patch }));

  const register = useCallback((index: number, handle: RealGkHandle | null) => {
    if (handle) handles.current.set(index, handle);
    else handles.current.delete(index);
  }, []);

  const fireAll = useCallback(() => {
    handles.current.forEach((h) => h.debugIncomingShot());
  }, []);
  const restartAll = useCallback(() => {
    handles.current.forEach((h) => h.restart());
  }, []);
  const togglePauseAll = useCallback(() => {
    handles.current.forEach((h) => h.togglePause());
    setPaused((p) => !p);
  }, []);

  // Synchronized shot cadence so every keeper faces the same beat at the same time (clean A/B).
  useEffect(() => {
    if (!running || paused) return;
    const kickoff = window.setTimeout(fireAll, 700); // first shot shortly after mount
    const id = window.setInterval(fireAll, FIRE_CADENCE_MS);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(id);
    };
  }, [running, paused, fireAll]);

  return (
    <div className="min-h-screen bg-[#04161f] p-4 text-white">
      <ScreenFilterDefs filters={filters} />
      <div className="mx-auto mb-4 flex max-w-[1600px] flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-bold">Keeper feel — comparação de transições</h1>
          <span className="text-xs text-white/50">
            Goleiro em autopilot (segue a bola, mergulha, defende, saca). Cada célula = 1 técnica isolada.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={togglePauseAll}>
            {paused ? 'Play all' : 'Pause all'}
          </Button>
          <Button size="sm" variant="outline" onClick={fireAll}>
            Fire shot (all)
          </Button>
          <Button size="sm" variant="outline" onClick={restartAll}>
            Restart all
          </Button>
          <Button size="sm" variant={running ? 'default' : 'outline'} onClick={() => setRunning((r) => !r)}>
            Auto-fire: {running ? 'on' : 'off'}
          </Button>
          <div className="ml-auto">
            <ScreenFilterControls
              filters={filters}
              onChange={patchFilters}
              open={filtersOpen}
              onToggleOpen={() => setFiltersOpen((v) => !v)}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {VARIANTS.map((variant, i) => (
          <FeelCell key={variant.id} variant={variant} index={i} register={register} filters={filters} />
        ))}
      </div>
    </div>
  );
}
