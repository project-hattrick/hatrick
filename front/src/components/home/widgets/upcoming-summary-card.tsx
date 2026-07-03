import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { SectionLink } from './section-link';
import { upcomingSummary } from '@/config/home.config';

/** Overview card: compact list of the next fixtures. */
function UpcomingSummaryCard() {
  return (
    <GlassPanel tone="surface" className="flex h-full flex-col">
      <SectionHeader
        title="Upcoming games"
        action={<span className="text-[11px] font-semibold text-neon">{upcomingSummary.total} games</span>}
      />
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        {upcomingSummary.fixtures.map((fixture) => (
          <div
            key={fixture.id}
            className="flex items-center justify-between rounded-lg bg-surface-3/40 px-2.5 py-1.5"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span aria-hidden>{fixture.home.flag}</span>
              <span>{fixture.home.code}</span>
              <span className="text-muted-foreground">vs</span>
              <span aria-hidden>{fixture.away.flag}</span>
              <span>{fixture.away.code}</span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">{fixture.kickoff}</span>
          </div>
        ))}
        <SectionLink href="/live" label="View full schedule" className="mt-auto self-start pt-1" />
      </div>
    </GlassPanel>
  );
}

export { UpcomingSummaryCard };
