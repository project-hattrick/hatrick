'use client';

import type { ReactNode, RefObject } from 'react';
import { GlassPanel } from '@/components/common/glass-panel';
import { Pause, Play } from '@/components/common/icons';
import type { EngineHandle } from '@/game/core/types';
import { useSandboxStore } from '@/store/sandbox.store';

const controlClass =
  'inline-flex h-9 items-center gap-1.5 rounded-md border border-border/60 bg-surface-1/80 px-3 text-xs font-bold uppercase tracking-wide transition hover:bg-surface-2 active:translate-y-px';

function ControlButton({ label, icon, onClick }: { label: string; icon?: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={controlClass} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

/** Bottom control bar — delegates to the imperative engine handle; labels come from the HUD store. */
export function GameControls({ handle }: { handle: RefObject<EngineHandle | null> }) {
  const paused = useSandboxStore((s) => s.paused);
  const speed = useSandboxStore((s) => s.speed);
  const cameraLabel = useSandboxStore((s) => s.cameraLabel);
  const targetLabel = useSandboxStore((s) => s.targetLabel);
  const rainLabel = useSandboxStore((s) => s.rainLabel);

  return (
    <GlassPanel
      radius="pill"
      className="pointer-events-auto fixed inset-x-0 bottom-3.5 z-10 mx-auto flex w-fit max-w-[96vw] flex-wrap items-center justify-center gap-2 p-2"
    >
      <ControlButton
        label={paused ? 'Resume' : 'Pause'}
        icon={paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        onClick={() => handle.current?.togglePause()}
      />
      <ControlButton label={`Speed x${speed}`} onClick={() => handle.current?.cycleSpeed()} />
      <ControlButton label={cameraLabel} onClick={() => handle.current?.cycleCamera()} />
      <ControlButton label={targetLabel} onClick={() => handle.current?.cycleTarget()} />
      <ControlButton label={`Rain: ${rainLabel}`} onClick={() => handle.current?.cycleRain()} />
      <ControlButton label="Restart" onClick={() => handle.current?.reset()} />
    </GlassPanel>
  );
}
