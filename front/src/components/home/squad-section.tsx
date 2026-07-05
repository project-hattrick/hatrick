import { FormationPitch } from './widgets/formation-pitch';
import { SquadAverageCard } from './widgets/squad-average-card';
import { ChemistryCard } from './widgets/chemistry-card';
import { DailyDuelCard } from './widgets/daily-duel-card';
import { SquadMiniStrip } from './widgets/squad-mini-strip';
import { SectionLink } from './widgets/section-link';
import { AppMode } from '@/enums/app-mode.enum';

/** "Your fantasy squad" — the XI on the pitch, squad strength, today's duel and the card row. */
export function SquadSection() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-title">Your fantasy squad</h2>
          <p className="text-sm text-muted-foreground">Your XI on the pitch · ready for the next 1v1</p>
        </div>
        <SectionLink href={`/${AppMode.Fantasy}`} label="Edit formation" className="mt-2" />
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <FormationPitch className="lg:h-full" />
        <div className="flex flex-col gap-4">
          <SquadAverageCard />
          <ChemistryCard />
          <DailyDuelCard />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-eyebrow text-muted-foreground">Your cards</h3>
          <SectionLink href={`/${AppMode.Fantasy}`} label="View collection" />
        </div>
        <SquadMiniStrip />
      </div>
    </div>
  );
}
