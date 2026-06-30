import Link from 'next/link';
import Image from 'next/image';
import { GlassPanel } from '@/components/common/glass-panel';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { lookup } from '@/lib/lookup';
import { toneConfig, toneFallback } from '@/config/tone.config';
import { formatThousands } from '@/lib/format';
import type { PackData } from '@/config/home.config';

function PackStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-surface-3/40 py-2">
      <span className="text-base font-bold">{value}</span>
      <span className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</span>
    </div>
  );
}

/** Featured pack card: box visual, contents breakdown and price CTA. */
function PackCard({ pack }: { pack: PackData }) {
  const accent = lookup(toneConfig, pack.tone, toneFallback);
  const Icon = pack.icon;

  return (
    <GlassPanel tone="surface" className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-4">
        <span className={cn('inline-flex size-14 items-center justify-center rounded-xl', accent.soft)}>
          <Icon className="size-7" />
        </span>
        <div className="flex flex-col">
          <h3 className="text-lg font-bold">{pack.name}</h3>
          <p className="text-xs text-muted-foreground">{pack.tagline}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <PackStat value={String(pack.players)} label="players" />
        <PackStat value={String(pack.rares)} label="rares" />
        <PackStat value={pack.topRating} label="rating" />
      </div>

      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-neon">
          <Image src="/coin.png" alt="" width={16} height={16} />
          {formatThousands(pack.price)} pts
        </span>
        <Link href="/store" className={buttonVariants({ size: 'sm', className: 'px-4' })}>
          Open
        </Link>
      </div>
    </GlassPanel>
  );
}

export { PackCard };
