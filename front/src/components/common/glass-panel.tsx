import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const glassPanelVariants = cva('border border-border/70 shadow-2xl backdrop-blur-md', {
  variants: {
    tone: {
      blur: 'bg-black/80',
      surface: 'bg-surface-2/95',
      dark: 'bg-surface-1/95',
    },
    radius: {
      lg: 'rounded-xl',
      xl: 'rounded-2xl',
      pill: 'rounded-full',
    },
  },
  defaultVariants: { tone: 'blur', radius: 'xl' },
});

type GlassPanelProps = React.ComponentProps<'div'> & VariantProps<typeof glassPanelVariants>;

/** The shared blurred widget surface — never copy-paste the glass classes. */
function GlassPanel({ className, tone, radius, ...props }: GlassPanelProps) {
  return (
    <div
      data-slot="glass-panel"
      className={cn(glassPanelVariants({ tone, radius }), className)}
      {...props}
    />
  );
}

export { GlassPanel, glassPanelVariants };
