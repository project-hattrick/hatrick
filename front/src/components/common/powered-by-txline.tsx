import { Broadcast, ArrowUpRight } from '@/components/common/icons';
import { cn } from '@/lib/utils';

/** The real-time data provider behind Hatrick — a small credit link ("puxa a sardinha" do TxLINE). */
export const TXLINE_URL = 'https://txline-dev.txodds.com';

/**
 * "Powered by TxLINE" credit with the provider name as an external link. `tone="hero"` reads over the dark
 * match stage; `tone="muted"` fits the footer.
 */
export function PoweredByTxline({ className, tone = 'muted' }: { className?: string; tone?: 'muted' | 'hero' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        tone === 'hero' ? 'text-white/70' : 'text-muted-foreground',
        className,
      )}
    >
      <Broadcast className="size-3.5 text-neon" weight="fill" />
      <span>Powered by</span>
      <a
        href={TXLINE_URL}
        target="_blank"
        rel="noreferrer"
        className="group inline-flex items-center gap-0.5 font-bold tracking-tight text-neon transition hover:text-neon/80"
      >
        TxLINE
        <ArrowUpRight className="size-3 opacity-60 transition group-hover:translate-x-px group-hover:opacity-100" />
      </a>
    </span>
  );
}
