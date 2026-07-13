'use client';

import { cn } from '@/lib/utils';

/** Glassy floating panel docked to a corner of the fullscreen engine surface. */
export function FloatingWidget({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'pointer-events-auto absolute z-20 w-max max-w-[320px] rounded-xl border border-white/10 bg-white/5 p-3 text-white shadow-xl backdrop-blur-md',
        className,
      )}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/50">{title}</div>
      {children}
    </div>
  );
}
