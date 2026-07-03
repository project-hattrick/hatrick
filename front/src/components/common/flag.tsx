import { cn } from '@/lib/utils';

interface FlagProps {
  /** ISO 3166-1 alpha-2 code for flag-icons (e.g. "br", "gb-eng"). */
  code: string;
  className?: string;
}

/** Country flag (flag-icons, 4x3). Sizes to the surrounding font unless a size class is passed. */
export function Flag({ code, className }: FlagProps) {
  return <span aria-hidden className={cn('fi rounded-[2px]', `fi-${code.toLowerCase()}`, className)} />;
}
