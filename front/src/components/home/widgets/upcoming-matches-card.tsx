import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { SectionLink } from './section-link';
import { upcomingMatches } from '@/config/home.config';

/** Board column: full list of upcoming fixtures. */
function UpcomingMatchesCard() {
  return (
    <GlassPanel tone="surface" className="flex h-full flex-col">
      <SectionHeader title="Upcoming matches" action={<SectionLink href="/live" label="View all" />} />
      <div className="flex flex-1 flex-col divide-y divide-border/40">
        {upcomingMatches.map((match) => (
          <div key={match.id} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <span className="text-lg leading-none" aria-hidden>{match.home.flag}</span>
                {match.home.code}
              </span>
              <span className="text-xs font-medium text-muted-foreground">vs</span>
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <span className="text-lg leading-none" aria-hidden>{match.away.flag}</span>
                {match.away.code}
              </span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{match.kickoff}</span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

export { UpcomingMatchesCard };
