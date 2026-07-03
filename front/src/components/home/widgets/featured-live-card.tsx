import Link from 'next/link';
import { Eye, Play } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { buttonVariants } from '@/components/ui/button';
import { AppMode } from '@/enums/app-mode.enum';
import { formatCompact } from '@/lib/format';
import { featuredLiveMatch } from '@/config/home.config';

/** Tiny tactical dot rendered on the mini pitch. */
function PitchDot({ left, top, className }: { left: string; top: string; className: string }) {
  return (
    <span
      className={`absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-surface-1 ${className}`}
      style={{ left, top }}
    />
  );
}

/** Spotlight live match: mini pitch scene, score bar and an open free prediction. */
export function FeaturedLiveCard() {
  const match = featuredLiveMatch;
  const liveHref = `/${AppMode.Live}`;

  return (
    <GlassPanel tone="surface" className="flex flex-col overflow-hidden">
      <div className="relative h-48 bg-[repeating-linear-gradient(90deg,#17301f_0_30px,#142a1b_30px_60px)] md:h-52">
        <div className="absolute top-[8%] bottom-[8%] left-1/2 border-l border-dashed border-white/25" />
        <div className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/25" />
        <PitchDot left="30%" top="44%" className="border-sky-400" />
        <PitchDot left="58%" top="40%" className="border-rose-500" />
        <PitchDot left="52%" top="60%" className="border-rose-500" />
        <span
          className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_#fff]"
          style={{ left: '46%', top: '50%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/90" />

        <span className="absolute top-3 left-3.5 inline-flex items-center gap-1.5 rounded-full border border-live/40 bg-black/55 px-2.5 py-1 text-[10px] font-bold text-live">
          <span className="size-1.5 animate-pulse rounded-full bg-live" />
          {match.minute}&apos; · {match.halfLabel}
        </span>
        <span className="absolute top-3 right-3.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="size-3.5" />
          {formatCompact(match.viewers)}
        </span>

        <div className="absolute right-3.5 bottom-3 left-3.5 flex items-center gap-2.5">
          <span className="text-xl leading-none" aria-hidden>{match.home.flag}</span>
          <span className="text-lg font-bold text-white">{match.home.code}</span>
          <span className="font-mono text-2xl font-bold text-white">
            {match.homeScore}–{match.awayScore}
          </span>
          <span className="text-lg font-bold text-white">{match.away.code}</span>
          <span className="text-xl leading-none" aria-hidden>{match.away.flag}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-neon" />
            {match.spotlight}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold tracking-widest text-neon uppercase">
            ● Predição aberta · grátis
          </span>
          <span className="text-base font-bold">{match.prediction.question}</span>
        </div>
        <div className="flex gap-2.5">
          <Link href={liveHref} className={buttonVariants({ variant: 'outline', className: 'h-10 flex-1 gap-1.5' })}>
            NÃO <span className="text-xs font-bold text-muted-foreground">+{match.prediction.noPoints}</span>
          </Link>
          <Link href={liveHref} className={buttonVariants({ className: 'h-10 flex-1 gap-1.5 font-semibold' })}>
            SIM <span className="text-xs font-bold">+{match.prediction.yesPoints}</span>
          </Link>
          <Link href={liveHref} className={buttonVariants({ variant: 'secondary', className: 'h-10 flex-[1.2] gap-1.5 font-semibold' })}>
            <Play className="size-4" />
            Assistir
          </Link>
        </div>
      </div>
    </GlassPanel>
  );
}
