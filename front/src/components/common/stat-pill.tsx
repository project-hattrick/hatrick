import * as React from 'react';
import { cn } from '@/lib/utils';

/** Rounded pill container used for the coin balance and small inline stats. */
function StatPill({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="stat-pill"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-2 px-2.5 py-1',
        className,
      )}
      {...props}
    />
  );
}

export { StatPill };
