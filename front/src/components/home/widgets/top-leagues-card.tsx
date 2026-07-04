import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { SectionLink } from './section-link';
import { formatCompact } from '@/lib/format';
import { topLeagues } from '@/config/home.config';

/** Overview card: most-followed leagues. */
function TopLeaguesCard() {
  return (
    <GlassPanel tone="surface" className="flex flex-col">
      <SectionHeader title="Top leagues" />
      <div className="flex flex-col gap-1.5 px-4 pb-4">
        {topLeagues.map((league, index) => (
          <div key={league.name} className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="w-4 text-center text-xs font-bold text-neon">{index + 1}</span>
              <span>{league.name}</span>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{formatCompact(league.followers)}</span>
          </div>
        ))}
        <SectionLink href="/live" label="View all leagues" className="self-start pt-1" />
      </div>
    </GlassPanel>
  );
}

export { TopLeaguesCard };
