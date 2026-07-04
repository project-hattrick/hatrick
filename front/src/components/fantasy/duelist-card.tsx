import Image from 'next/image';
import { Flag } from '@/components/common/flag';
import { fifaToIso } from '@/lib/country';
import { cn } from '@/lib/utils';
import { rankTierConfig, type Duelist } from '@/config/matchmaking.config';

/** One side of the VS screen — portrait, flag, tier badge, MMR and win/loss record. */
export function DuelistCard({ duelist, highlight }: { duelist: Duelist; highlight?: boolean }) {
  const tier = rankTierConfig[duelist.tier];

  return (
    <div
      className={cn(
        'relative flex flex-1 flex-col items-center gap-2 rounded-2xl border p-4 text-center',
        highlight ? 'border-neon/40 bg-neon/[0.05]' : 'border-border bg-surface-2/60',
      )}
    >
      {highlight ? <span className="text-eyebrow absolute top-2.5 left-3 text-neon">You</span> : null}

      <span className="relative grid size-16 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-white/10">
        <Image
          src={duelist.portraitSrc}
          alt={duelist.name}
          width={64}
          height={64}
          className="translate-y-[6%] scale-110 object-contain object-bottom"
          style={{ imageRendering: 'pixelated' }}
        />
      </span>

      <div className="flex items-center gap-1.5">
        <Flag code={fifaToIso(duelist.country)} className="text-sm" />
        <span className="max-w-[9rem] truncate text-sm font-bold">{duelist.name}</span>
      </div>

      <span
        className="text-eyebrow rounded-full px-2.5 py-1"
        style={{ backgroundImage: `linear-gradient(to bottom, ${tier.from}, ${tier.to})`, color: tier.text }}
      >
        {tier.label} {duelist.division}
      </span>

      <div className="flex flex-col items-center">
        <span className="font-mono text-lg font-bold tabular-nums text-foreground">{duelist.rating}</span>
        <span className="text-micro text-muted-foreground">MMR</span>
      </div>

      <div className="text-micro flex items-center gap-1.5 text-muted-foreground">
        <span className="font-semibold text-neon">{duelist.wins}W</span>
        <span className="font-semibold text-live">{duelist.losses}L</span>
        <span>·</span>
        <span>{duelist.streak}</span>
      </div>
    </div>
  );
}
