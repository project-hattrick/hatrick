import { MatchHeroCard } from './match-hero-card';
import { LiveMatchCard } from './live-match-card';
import { PerformanceChart } from './performance-chart';
import { TeamStatisticCard } from './team-statistic-card';
import { TeamFormationCard } from './team-formation-card';
import { TeamLineupCard } from './team-lineup-card';
import { GroupStageTable } from './group-stage-table';

/** Match-analytics dashboard shown above the fantasy section on the home. */
export function MatchDashboard() {
  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <MatchHeroCard />
          <PerformanceChart />
          <TeamFormationCard />
        </div>
        <div className="flex flex-col gap-4">
          <LiveMatchCard />
          <TeamStatisticCard />
          <TeamLineupCard />
        </div>
      </div>
      <GroupStageTable />
    </section>
  );
}
