import { FormationPitch } from './widgets/formation-pitch';
import { TeamStrengthCard } from './widgets/team-strength-card';
import { DailyDuelCard } from './widgets/daily-duel-card';
import { SquadCarousel } from './widgets/squad-carousel';
import { SectionLink } from './widgets/section-link';
import { AppMode } from '@/enums/app-mode.enum';
import { squad } from '@/config/squad.config';

/** "Seu time no fantasy" — the XI on the pitch, squad strength, today's duel and the card row. */
export function SquadSection() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Seu time no fantasy</h2>
          <p className="text-sm text-muted-foreground">Seu XI em campo · pronto pro próximo 1v1</p>
        </div>
        <SectionLink href={`/${AppMode.Fantasy}`} label="Editar formação" className="mt-2" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <FormationPitch />
        <div className="flex flex-col gap-4">
          <TeamStrengthCard />
          <DailyDuelCard />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-wider uppercase">Suas cartas</h3>
          <SectionLink href={`/${AppMode.Fantasy}`} label="Ver coleção" />
        </div>
        <SquadCarousel players={squad} />
      </div>
    </div>
  );
}
