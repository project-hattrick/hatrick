'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Camera, Lightning, Pause, Play, SoccerBall } from '@/components/common/icons';
import { GoalBurst } from '@/components/game/goal-burst';
import { RestartBanner } from '@/components/game/real-gk/restart-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AWAY_TEAM_PACKS, REAL_GK_FRANCE_VS_NL_CONFIG } from '@/game/realgk/config';
import { createRealGkEngine } from '@/game/realgk/engine';
import { allFeelOn } from '@/game/realgk/sim/feel';
import type { RealGkHandle } from '@/game/realgk/types';
import { useRealGkStore } from '@/store/real-gk.store';
import {
  SIGNATURE_FILTERS,
  ScreenFilterControls,
  ScreenFilterDefs,
  ScreenFilterLayers,
  canvasFilterCss,
  type ScreenFilterState,
} from './screen-filters';

const HOME = AWAY_TEAM_PACKS.argentina;
const AWAY = AWAY_TEAM_PACKS.norway;

/**
 * Argentina vs Norway (both recolored packs) with EVERY feel technique on + the live screen-filter editor
 * on top — tune the effects in real time, pause the figures, and watch it reflect on the characters.
 */
export function ArgentinaVsNorwayEditorArena() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<RealGkHandle | null>(null);
  const [filters, setFilters] = useState<ScreenFilterState>(SIGNATURE_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const patchFilters = (patch: Partial<ScreenFilterState>) => setFilters((prev) => ({ ...prev, ...patch }));

  const scoreBlue = useRealGkStore((s) => s.scoreBlue);
  const scoreRed = useRealGkStore((s) => s.scoreRed);
  const clock = useRealGkStore((s) => s.clock);
  const paused = useRealGkStore((s) => s.paused);
  const speed = useRealGkStore((s) => s.speed);
  const cameraLabel = useRealGkStore((s) => s.cameraLabel);
  const ballText = useRealGkStore((s) => s.ballText);
  const goalActive = useRealGkStore((s) => s.goalActive);
  const goalTeam = useRealGkStore((s) => s.goalTeam);
  const restartActive = useRealGkStore((s) => s.restartActive);
  const restartLabel = useRealGkStore((s) => s.restartLabel);
  const restartTeam = useRealGkStore((s) => s.restartTeam);

  const config = useMemo(
    () => ({
      ...REAL_GK_FRANCE_VS_NL_CONFIG,
      personaBodyRoot: HOME.root,
      personaBodyRootAway: AWAY.root,
      teams: { blue: HOME.brand, red: AWAY.brand },
      feel: allFeelOn(),
    }),
    [],
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

      <GoalBurst
        active={goalActive}
        team={goalTeam}
        blueName={HOME.brand.name}
        redName={AWAY.brand.name}
        scoreBlue={scoreBlue}
        scoreRed={scoreRed}
        clock={clock}
        accent={goalTeam === 'red' ? AWAY.accent : HOME.accent}
      />
      <RestartBanner active={restartActive} label={restartLabel} team={restartTeam} teamName={restartTeam === 'red' ? AWAY.brand.name : HOME.brand.name} />

      <div className="absolute left-3 top-3 z-10">
        <ScreenFilterControls filters={filters} onChange={patchFilters} open={filtersOpen} onToggleOpen={() => setFiltersOpen((v) => !v)} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-white/10 bg-black/55 px-5 py-2 backdrop-blur">
          <span className="max-w-[24vw] truncate text-right text-sm font-semibold" style={{ color: HOME.accent }}>{HOME.brand.name}</span>
          <span className="font-mono text-2xl font-bold tabular-nums text-white">
            {scoreBlue}<span className="mx-1 text-white/40">-</span>{scoreRed}
          </span>
          <span className="max-w-[24vw] truncate text-left text-sm font-semibold" style={{ color: AWAY.accent }}>{AWAY.brand.name}</span>
          <span className="ml-2 border-l border-white/15 pl-3 font-mono text-xs text-white/70">{clock}</span>
        </div>
        <Badge variant="outline" className="pointer-events-auto border-white/15 bg-black/45 text-white/80">
          <SoccerBall className="mr-1 size-3.5" /> {ballText}
        </Badge>
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
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.cycleSpeed()}>
          <Lightning className="size-4" />
          {speed}x
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleRef.current?.restart()}>
          Restart
        </Button>
      </div>
    </div>
  );
}
