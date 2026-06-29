'use client';

import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui.store';
import { Dimension } from '@/enums/dimension.enum';

/** Placeholder match stage — the real 2D/2.5D renderer + game loop mount here later. */
export function MatchBackground() {
  const perspective = useUiStore((state) => state.dimension) === Dimension.TwoFiveD;

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1400px' }}>
        <div
          className={cn(
            'relative aspect-[3/2] w-[120%] origin-center rounded-md transition-transform duration-700',
            'bg-[repeating-linear-gradient(90deg,#0d2a18_0_8%,rgba(13,42,24,0.5)_8%_16%)]',
          )}
          style={perspective ? { transform: 'rotateX(58deg) scale(1.12)' } : undefined}
        >
          <div className="absolute inset-6 rounded-sm border-2 border-white/10" />
          <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/10" />
          <div className="absolute top-6 bottom-6 left-1/2 w-0.5 -translate-x-1/2 bg-white/10" />
        </div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_0%,rgba(174,240,25,0.10),transparent_42%),radial-gradient(120%_90%_at_100%_100%,rgba(174,240,25,0.08),transparent_42%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/90" />
    </div>
  );
}
