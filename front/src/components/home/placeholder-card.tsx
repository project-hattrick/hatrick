import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/common/glass-panel';

interface PlaceholderCardProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

/** Skeleton-style placeholder for sections still to be built out. */
function PlaceholderCard({ title, subtitle, className }: PlaceholderCardProps) {
  return (
    <GlassPanel tone="surface" className={cn('flex flex-col gap-4 p-5', className)}>
      <div className="aspect-video w-full rounded-lg bg-surface-3/60" />
      {title ? (
        <span className="text-sm font-semibold text-foreground">{title}</span>
      ) : (
        <div className="h-4 w-2/3 rounded bg-surface-3/70" />
      )}
      {subtitle ? <span className="text-xs font-medium text-neon">{subtitle}</span> : null}
      <div className="h-3 w-full rounded bg-surface-3/40" />
      <div className="h-3 w-4/5 rounded bg-surface-3/30" />
    </GlassPanel>
  );
}

export { PlaceholderCard };
