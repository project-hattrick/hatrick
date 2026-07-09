import { cn } from '@/lib/utils';
import type { Icon } from '@/components/common/icons';

/** Store tile badge tones — value (neon), hot (danger), owned (positive), muted info. */
export const enum BadgeTone {
  Value = 'value',
  Hot = 'hot',
  Owned = 'owned',
  Info = 'info',
}

const toneClass: Record<BadgeTone, string> = {
  [BadgeTone.Value]: 'bg-neon text-black',
  [BadgeTone.Hot]: 'bg-danger text-white',
  [BadgeTone.Owned]: 'bg-neon/15 text-neon',
  [BadgeTone.Info]: 'border border-border/70 bg-surface-1/80 text-muted-foreground',
};

/** Small pill for urgency / value / status — one consistent shape across every store card. */
export function StoreBadge({
  tone = BadgeTone.Info,
  icon: BadgeIcon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: Icon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-1 py-px text-[0.5625rem] leading-3 font-semibold tracking-wide uppercase',
        toneClass[tone],
        className,
      )}
    >
      {BadgeIcon && <BadgeIcon className="size-2.5" weight="fill" />}
      {children}
    </span>
  );
}
