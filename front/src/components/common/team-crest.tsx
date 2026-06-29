import { cn } from '@/lib/utils';

interface TeamCrestProps {
  code: string;
  flag: string;
  className?: string;
}

/** Stacked flag + 3-letter code. Generic art only — no FIFA marks. */
function TeamCrest({ code, flag, className }: TeamCrestProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <span className="text-2xl leading-none" aria-hidden>
        {flag}
      </span>
      <span className="text-[10px] font-bold tracking-widest text-foreground">{code}</span>
    </div>
  );
}

export { TeamCrest };
