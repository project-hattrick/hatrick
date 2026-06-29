import * as React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps extends React.ComponentProps<'div'> {
  title: string;
  action?: React.ReactNode;
}

/** Panel header: neon accent bar + uppercase tracked title + optional right slot. */
function SectionHeader({ title, action, className, ...props }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-2 px-4 py-3', className)} {...props}>
      <div className="flex items-center gap-2.5">
        <span className="h-3.5 w-1 rounded-full bg-neon" />
        <span className="text-[10px] font-bold tracking-wider text-foreground uppercase">{title}</span>
      </div>
      {action}
    </div>
  );
}

export { SectionHeader };
