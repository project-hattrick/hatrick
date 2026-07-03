import Link from 'next/link';
import { GlassPanel } from '@/components/common/glass-panel';
import { buttonVariants } from '@/components/ui/button';
import { AppMode } from '@/enums/app-mode.enum';
import { liveRailMatches, type LiveScoreMatch } from '@/config/home.config';
import { FeaturedLiveCard } from './widgets/featured-live-card';
import { WatchTogetherCard } from './widgets/watch-together-card';
import { SectionLink } from './widgets/section-link';

/** Compact rail row: minute, score line and a jump-in action. */
function LiveRailRow({ match }: { match: LiveScoreMatch }) {
  return (
    <GlassPanel tone="surface" radius="lg" className="flex items-center gap-3 px-3.5 py-3">
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-live">
        <span className="size-1.5 animate-pulse rounded-full bg-live" />
        {match.minute}&apos;
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-base leading-none" aria-hidden>{match.home.flag}</span>
        <span className="text-sm font-bold">{match.home.code}</span>
        <span className="font-mono text-sm font-bold">
          {match.homeScore}–{match.awayScore}
        </span>
        <span className="text-sm font-bold">{match.away.code}</span>
        <span className="text-base leading-none" aria-hidden>{match.away.flag}</span>
      </div>
      <Link
        href={`/${AppMode.Live}`}
        className={buttonVariants({ variant: 'outline', size: 'sm', className: 'shrink-0 px-3' })}
      >
        Watch
      </Link>
    </GlassPanel>
  );
}

/** "Live right now" — featured live match plus a rail of other games and watch-together. */
export function LiveMatchesSection() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight md:text-2xl">
            <span className="size-2 animate-pulse rounded-full bg-live" />
            Live right now
          </h2>
          <p className="text-sm text-muted-foreground">Jump into the spotlight or invite someone to watch together</p>
        </div>
        <SectionLink href={`/${AppMode.Live}`} label="View all" className="mt-1" />
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-[1.5fr_1fr]">
        <FeaturedLiveCard />
        <div className="flex flex-col gap-3">
          {liveRailMatches.map((match) => (
            <LiveRailRow key={match.id} match={match} />
          ))}
          <WatchTogetherCard />
        </div>
      </div>
    </section>
  );
}
