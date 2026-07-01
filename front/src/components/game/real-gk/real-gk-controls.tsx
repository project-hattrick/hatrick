'use client';

import type { RefObject } from 'react';
import { GlassPanel } from '@/components/common/glass-panel';
import { Pause, Play } from '@/components/common/icons';
import type { RealGkHandle } from '@/game/realgk/types';
import { useRealGkStore } from '@/store/real-gk.store';

const controlClass =
  'inline-flex h-9 items-center gap-1.5 rounded-md border border-border/60 bg-surface-1/80 px-3 text-xs font-bold uppercase tracking-wide transition hover:bg-surface-2 active:translate-y-px';

/** Bottom control bar for the v2 runtime. Stays visible so "Show UI" can bring the HUD back. */
export function RealGkControls({ handle }: { handle: RefObject<RealGkHandle | null> }) {
  const paused = useRealGkStore((s) => s.paused);
  const speed = useRealGkStore((s) => s.speed);
  const cameraLabel = useRealGkStore((s) => s.cameraLabel);
  const targetLabel = useRealGkStore((s) => s.targetLabel);
  const uiHidden = useRealGkStore((s) => s.uiHidden);
  const toggleUi = useRealGkStore((s) => s.toggleUi);

  return (
    <GlassPanel
      radius="pill"
      className="pointer-events-auto fixed inset-x-0 bottom-3.5 z-10 mx-auto flex w-fit max-w-[96vw] flex-wrap items-center justify-center gap-2 p-2"
    >
      <button type="button" className={controlClass} onClick={() => handle.current?.togglePause()}>
        {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        {paused ? 'Resume' : 'Pause'}
      </button>
      <button type="button" className={controlClass} onClick={() => handle.current?.restart()}>
        Restart
      </button>
      <button type="button" className={controlClass} onClick={() => handle.current?.cycleSpeed()}>
        {speed}x
      </button>
      <button type="button" className={controlClass} onClick={() => handle.current?.cycleCamera()}>
        {cameraLabel}
      </button>
      <button type="button" className={controlClass} onClick={() => handle.current?.cycleTarget()}>
        {targetLabel}
      </button>
      <button type="button" className={controlClass} onClick={() => handle.current?.spawnReferee()}>
        Spawn referee
      </button>
      <button type="button" className={controlClass} onClick={toggleUi}>
        {uiHidden ? 'Show UI' : 'Hide UI'}
      </button>
    </GlassPanel>
  );
}
