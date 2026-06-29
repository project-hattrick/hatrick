import * as React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps extends React.ComponentProps<'section'> {
  surface?: boolean;
}

/** Scrollable page section with a scroll-driven reveal; `surface` hides the parallax stage. */
function Section({ className, surface, children, ...props }: SectionProps) {
  return (
    <section
      className={cn(
        'reveal relative w-full px-6 py-20 md:py-28',
        surface ? 'bg-background' : 'bg-background/70 backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

export { Section };
