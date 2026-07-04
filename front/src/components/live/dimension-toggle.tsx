'use client';

import { Dimension } from '@/enums/dimension.enum';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

const OPTIONS = [Dimension.TwoD, Dimension.TwoFiveD];

/** 2D / 2.5D match-stage switch (state in ui.store, not useState). */
export function DimensionToggle() {
  const dimension = useUiStore((state) => state.dimension);
  const setDimension = useUiStore((state) => state.setDimension);

  return (
    <div className="flex items-center gap-0.5">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setDimension(option)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-bold transition',
            option === dimension ? 'bg-neon text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
