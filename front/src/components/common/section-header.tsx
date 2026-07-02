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
      <span className="text-[10px] font-bold tracking-wider text-foreground uppercase">{title}</span>
      {action}
    </div>
  );
}

export { SectionHeader };
