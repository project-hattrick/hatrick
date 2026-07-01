import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WireBlockProps {
  label?: string;
  className?: string;
  children?: ReactNode;
}

/** Low-fi wireframe placeholder: a dashed surface with a label. Swap for the real widget later. */
export function WireBlock({ label, className, children }: WireBlockProps) {
  return (
    <div
      className={cn(
        'flex min-h-16 items-center justify-center rounded-xl border border-dashed border-border/70 bg-surface-2/40 p-3 text-center text-[11px] text-muted-foreground',
        className,
      )}
    >
      {children ?? label}
    </div>
  );
}
