'use client';

import Link from 'next/link';
import {
  Broadcast,
  GameController,
  MagnifyingGlass,
  Pulse,
  ShieldCheck,
  Sword,
  Users,
} from '@/components/common/icons';
import { BetSelector } from '@/components/fantasy/bet-selector';
import { ChallengePicker } from '@/components/home/challenge-picker';
import { MatchmakingDialog } from '@/components/fantasy/matchmaking-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { featuredLiveMatch } from '@/config/home.config';
import { AppMode } from '@/enums/app-mode.enum';
import { useHomeEntryStore } from '@/store/home-entry.store';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

interface EntryOptionProps {
  icon: typeof Pulse;
  eyebrow: string;
  title: string;
  description: string;
  action: React.ReactNode;
  featured?: boolean;
}

function EntryOption({ icon: Icon, eyebrow, title, description, action, featured }: EntryOptionProps) {
  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-2xl border bg-surface-2/55 p-4',
        featured ? 'border-neon/35 shadow-[inset_0_0_30px_rgba(174,240,25,0.04)]' : 'border-border/70',
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', featured ? 'bg-neon/15 text-neon' : 'bg-surface-3 text-muted-foreground')}>
          <Icon className="size-5" weight={featured ? 'fill' : 'duotone'} />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-micro tracking-wider text-muted-foreground uppercase">{eyebrow}</p>
          <h3 className="mt-1 text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </article>
  );
}

export function HomeModeDialogs() {
  const activeMode = useHomeEntryStore((state) => state.activeMode);
  const closeMode = useHomeEntryStore((state) => state.closeMode);
  const startMatchmaking = useHomeEntryStore((state) => state.startMatchmaking);
  const matchmakingOpen = useHomeEntryStore((state) => state.matchmakingOpen);
  const setMatchmakingOpen = useHomeEntryStore((state) => state.setMatchmakingOpen);
  const challengeBet = useUiStore((state) => state.challengeBet);
  const setChallengeBet = useUiStore((state) => state.setChallengeBet);
  const isFantasy = activeMode === AppMode.Fantasy;
  const Icon = isFantasy ? GameController : Broadcast;

  return (
    <>
      <Dialog open={activeMode !== null} onOpenChange={(open) => !open && closeMode()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="size-5 text-neon" weight="fill" />
              {isFantasy ? 'Choose your opponent' : 'How do you want to watch?'}
            </DialogTitle>
            <DialogDescription>
              {isFantasy
                ? 'Jump into the ranked queue or challenge a specific player.'
                : 'Join the match happening now or start an invite-only room.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {isFantasy ? (
              <>
                <EntryOption
                  icon={Sword}
                  eyebrow="Ranked matchmaking"
                  title="Find an opponent"
                  description="We will match you with a player around your current MMR."
                  featured
                  action={
                    <Button size="lg" className="h-10 w-full gap-2 rounded-xl font-semibold" onClick={startMatchmaking}>
                      <Sword className="size-4" />
                      Start matchmaking
                    </Button>
                  }
                />
                <EntryOption
                  icon={MagnifyingGlass}
                  eyebrow="Direct challenge"
                  title="Find a specific player"
                  description="Pick your stake, pick a player, build your XI."
                  action={
                    <div className="flex flex-col gap-3">
                      <BetSelector amount={challengeBet} onSelect={setChallengeBet} />
                      <ChallengePicker onPick={closeMode} />
                    </div>
                  }
                />
              </>
            ) : (
              <>
                <EntryOption
                  icon={Pulse}
                  eyebrow={`Live · ${featuredLiveMatch.minute}'`}
                  title={`${featuredLiveMatch.home.flag} ${featuredLiveMatch.home.code} ${featuredLiveMatch.homeScore}–${featuredLiveMatch.awayScore} ${featuredLiveMatch.away.code} ${featuredLiveMatch.away.flag}`}
                  description={`${featuredLiveMatch.halfLabel} · ${featuredLiveMatch.viewers.toLocaleString('en-US')} watching now.`}
                  featured
                  action={
                    <Link
                      href={`/?match=${featuredLiveMatch.id}`}
                      onClick={closeMode}
                      className={buttonVariants({ size: 'lg', className: 'h-10 w-full gap-2 rounded-xl font-semibold' })}
                    >
                      <Broadcast className="size-4" />
                      Join live match
                    </Link>
                  }
                />
                <EntryOption
                  icon={ShieldCheck}
                  eyebrow="Invite only"
                  title="Private room"
                  description="Create a closed room and invite friends to watch, predict and chat."
                  action={
                    <Link
                      href="/?room=new"
                      onClick={closeMode}
                      className={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-10 w-full gap-2 rounded-xl' })}
                    >
                      <Users className="size-4" />
                      Create private room
                    </Link>
                  }
                />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MatchmakingDialog open={matchmakingOpen} onOpenChange={setMatchmakingOpen} />
    </>
  );
}
