import { MatchHeroCard } from './match-hero-card';
import { LiveMatchCard } from './live-match-card';
import { TeamStatisticCard } from './team-statistic-card';
import { TeamFormationCard } from './team-formation-card';
import { TeamLineupCard } from './team-lineup-card';
import { GroupStageTable } from './group-stage-table';
import { UpcomingOddsCard } from './upcoming-odds-card';
import { MyBetsCard } from './my-bets-card';
import { KeyEventsCard } from './key-events-card';

/**
 * Match-analytics dashboard shown above the fantasy section on the home — layout variant D from the
 * layout lab ("fix in place"): the wide left column carries the hero, the landscape pitch and the
 * head-to-head line-up sheet; the narrow right column is the live/betting rail.
 *
 * Perfect grid on every screen: the grid keeps its default `items-stretch`, so both columns take the
 * row height. Whichever column is naturally shorter would leave a void before the full-width Group
 * Stage row — so each column's TRAILING card flex-fills the slack (Team Line Up on the left, My Bets
 * on the right). The taller column has no slack, so its filler stays natural; the shorter one's
 * filler grows until both columns end flush. Reordering content or window size can't reopen the gap.
 * The pitch stays aspect-locked (never balloons — the original giant-formation bug).
 *
 * Responsive: single column on phones (each card full-width, the fillers go inert — a lone card per
 * grid row is already its natural height); the two-column split comes in at `md` so tablets don't
 * stretch the 320px-wide rail cards across the whole viewport. `minmax(0,1fr)` lets the wide column
 * shrink instead of overflowing on long content.
 */
export function MatchDashboard() {
  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <MatchHeroCard />
          <TeamFormationCard />
          <TeamLineupCard />
        </div>
        <div className="flex flex-col gap-4">
          <LiveMatchCard />
          <TeamStatisticCard />
          <KeyEventsCard />
          <UpcomingOddsCard />
          <MyBetsCard />
        </div>
      </div>

      <GroupStageTable />
    </section>
  );
}
