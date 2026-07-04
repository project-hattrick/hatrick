import { GlassPanel } from '@/components/common/glass-panel';
import { Trophy } from '@/components/common/icons';
import { bracketRounds, type BracketMatch, type BracketTeam } from '@/config/bracket.config';
import { cn } from '@/lib/utils';

function TeamRow({ team, score, win, dim }: { team: BracketTeam; score?: number; win?: boolean; dim?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5',
        win && 'bg-surface-deep',
      )}
    >
      <span className="flex items-center gap-2">
        <span className="text-base leading-none" aria-hidden>
          {team.flag}
        </span>
        <span className={cn('text-xs font-bold tracking-wide', win ? 'text-neon' : dim ? 'text-muted-foreground' : 'text-foreground/85')}>
          {team.code}
        </span>
      </span>
      {score != null ? (
        <span className={cn('font-talero text-xs tabular-nums', win ? 'text-neon' : 'text-muted-foreground')}>{score}</span>
      ) : null}
    </div>
  );
}

function MatchCard({ match }: { match: BracketMatch }) {
  const { home, away, homeScore, awayScore, winner, upcoming } = match;
  return (
    <GlassPanel tone="surface" className="w-40 shrink-0 p-1.5">
      <TeamRow team={home} score={homeScore} win={winner === 'home'} dim={upcoming} />
      <div className="mx-2.5 my-0.5 border-t border-border/50" />
      <TeamRow team={away} score={awayScore} win={winner === 'away'} dim={upcoming} />
      {upcoming ? (
        <p className="px-2.5 pt-1 text-center text-eyebrow text-neon/80">Up next</p>
      ) : null}
    </GlassPanel>
  );
}

/** Knockout bracket above the squad — quarterfinals → final → trophy, mock data, no FIFA marks. */
export function CupBracketSection() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-display">Road to the final</h2>
        <p className="text-sm text-muted-foreground">Knockout bracket — predict who lifts the trophy.</p>
      </div>

      <div className="flex min-h-[20rem] justify-between gap-4 overflow-x-auto pb-2">
        {bracketRounds.map((round) => (
          <div key={round.title} className="flex shrink-0 flex-col gap-3">
            <h3 className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">{round.title}</h3>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {round.matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}

        <div className="flex shrink-0 flex-col gap-3">
          <h3 className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">Champion</h3>
          <div className="flex flex-1 flex-col justify-center">
            <GlassPanel className="flex w-40 flex-col items-center gap-2 p-5 text-center">
              <Trophy className="size-8 text-neon" />
              <span className="text-sm font-bold">TBD</span>
              <span className="text-eyebrow text-muted-foreground">Lift the cup</span>
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
