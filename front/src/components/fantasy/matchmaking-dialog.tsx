'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { CountdownRing } from '@/components/live/countdown-ring';
import { DuelistCard } from './duelist-card';
import { formatTokens } from './bet-selector';
import { Sword, Check, Lightning, Coins, ShieldCheck } from '@/components/common/icons';
import { AppMode } from '@/enums/app-mode.enum';
import { MatchPhase } from '@/enums/match-phase.enum';
import {
  ACCEPT_SECONDS,
  MMR_STAKE,
  SEARCH_MS,
  opponentDuelist,
  rankTierConfig,
  selfDuelist,
  type Duelist,
} from '@/config/matchmaking.config';

interface MatchmakingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, skip the search and go straight to a ready-check against this player. */
  opponent?: Duelist;
  /** Token stake picked in the entry modal — displayed on direct challenges only. */
  bet?: number;
  /** Fired when the player accepts a direct challenge (used to launch the duel arena). */
  onConfirm?: () => void;
}

const HEADINGS: Record<MatchPhase, { title: string; description: string }> = {
  [MatchPhase.Searching]: { title: 'Finding an opponent', description: 'Ranked Duel · matching you by MMR.' },
  [MatchPhase.Found]: { title: 'Opponent found', description: 'Ready check — accept to enter the pitch.' },
  [MatchPhase.Accepted]: { title: 'Match ready', description: 'Loading the 1v1 arena…' },
};

/**
 * Ranked-duel matchmaking modal — a phase-driven flow (searching → opponent found →
 * accepted) on the shared Dialog shell, mirroring the login-dialog step pattern.
 * Timers are mocked until real matchmaking lands.
 */
export function MatchmakingDialog({ open, onOpenChange, opponent, bet, onConfirm }: MatchmakingDialogProps) {
  const isChallenge = Boolean(opponent);
  const activeOpponent = opponent ?? opponentDuelist;
  const openPhase = isChallenge ? MatchPhase.Found : MatchPhase.Searching;

  const [phase, setPhase] = useState(openPhase);
  const [seconds, setSeconds] = useState(ACCEPT_SECONDS);
  const [elapsed, setElapsed] = useState(0);
  const [wasOpen, setWasOpen] = useState(false);

  // Reset the flow each time the dialog opens — adjust state during render (not in an effect).
  if (open && !wasOpen) {
    setWasOpen(true);
    setPhase(openPhase);
    setSeconds(ACCEPT_SECONDS);
    setElapsed(0);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  // Searching: count up, then flip to "found" after a short scan.
  useEffect(() => {
    if (!open || phase !== MatchPhase.Searching) return;
    const found = window.setTimeout(() => setPhase(MatchPhase.Found), SEARCH_MS);
    const tick = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      window.clearTimeout(found);
      window.clearInterval(tick);
    };
  }, [open, phase]);

  // Found: the ready-check countdown empties toward 0.
  useEffect(() => {
    if (!open || phase !== MatchPhase.Found) return;
    const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [open, phase]);

  const heading =
    isChallenge && phase === MatchPhase.Found
      ? { title: `Challenging ${activeOpponent.name}`, description: 'Ready check — accept to enter the arena.' }
      : HEADINGS[phase];
  const expired = seconds === 0;
  const selfTier = rankTierConfig[selfDuelist.tier];

  const requeue = () => {
    setPhase(openPhase);
    setSeconds(ACCEPT_SECONDS);
    setElapsed(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sword className="size-5 text-neon" weight="fill" />
            {heading.title}
          </DialogTitle>
          <DialogDescription>{heading.description}</DialogDescription>
        </DialogHeader>

        <div key={phase} className="animate-in fade-in-0 zoom-in-95 duration-300">
          {phase === MatchPhase.Searching ? (
            <SearchingView elapsed={elapsed} tier={`${selfTier.label} ${selfDuelist.division}`} rating={selfDuelist.rating} />
          ) : phase === MatchPhase.Found ? (
            <FoundView seconds={seconds} opponent={activeOpponent} bet={isChallenge ? bet : undefined} />
          ) : (
            <AcceptedView />
          )}
        </div>

        {phase === MatchPhase.Searching ? (
          <DialogFooter>
            <Button variant="outline" shape="pill" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancel search
            </Button>
          </DialogFooter>
        ) : phase === MatchPhase.Found ? (
          <DialogFooter>
            <Button variant="outline" shape="pill" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Decline
            </Button>
            {expired ? (
              <Button shape="pill" className="w-full sm:w-auto" onClick={requeue}>
                Search again
              </Button>
            ) : (
              <Button shape="pill" className="w-full gap-2 sm:w-auto" onClick={() => setPhase(MatchPhase.Accepted)}>
                <Check className="size-4" />
                Accept · {seconds}s
              </Button>
            )}
          </DialogFooter>
        ) : (
          <DialogFooter>
            {isChallenge ? (
              <Button
                shape="pill"
                className="w-full gap-2 sm:w-auto"
                onClick={() => {
                  onConfirm?.();
                  onOpenChange(false);
                }}
              >
                <Lightning className="size-4" weight="fill" />
                Enter the arena
              </Button>
            ) : (
              <Link
                href={`/${AppMode.Fantasy}`}
                onClick={() => onOpenChange(false)}
                className={buttonVariants({ shape: 'pill', className: 'w-full gap-2 sm:w-auto' })}
              >
                <Lightning className="size-4" weight="fill" />
                Enter the pitch
              </Link>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Radar scan over the player's portrait while queueing. */
function SearchingView({ elapsed, tier, rating }: { elapsed: number; tier: string; rating: number }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative grid size-28 place-items-center">
        <span className="absolute size-28 animate-ping rounded-full border border-neon/25" />
        <span className="absolute size-20 animate-ping rounded-full border border-neon/20 [animation-delay:500ms]" />
        <span className="absolute size-28 rounded-full border border-border" />
        <span className="relative grid size-16 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-white/10">
          <Image
            src={selfDuelist.portraitSrc}
            alt={selfDuelist.name}
            width={64}
            height={64}
            className="translate-y-[6%] scale-110 object-contain object-bottom"
            style={{ imageRendering: 'pixelated' }}
          />
        </span>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-semibold">Searching for an opponent…</span>
        <span className="text-micro text-muted-foreground">
          {tier} · ~{rating} MMR · {elapsed}s elapsed
        </span>
      </div>
    </div>
  );
}

/** The VS reveal — you vs the matched opponent, with a ready-check ring. */
function FoundView({
  seconds,
  opponent,
  bet,
}: {
  seconds: number;
  opponent: Duelist;
  /** Token stake picked in the entry modal — set only on direct challenges; ranked queue stays MMR-only. */
  bet?: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <DuelistCard duelist={selfDuelist} highlight />
        <div className="flex shrink-0 flex-col items-center justify-center gap-2 px-0.5">
          <span className="neon-text font-heading text-2xl font-black tracking-tight text-neon">VS</span>
          <CountdownRing seconds={seconds} max={ACCEPT_SECONDS} label="Accept time remaining" />
        </div>
        <DuelistCard duelist={opponent} />
      </div>
      {bet !== undefined ? (
        <div className="flex flex-col items-center gap-1">
          <span className="flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums text-neon">
            <Coins className="size-4" weight="fill" />
            {formatTokens(bet)} tokens each
          </span>
          <span className="text-micro flex items-center gap-1 text-muted-foreground">
            <ShieldCheck className="size-3.5 text-neon" />
            Winner takes {formatTokens(bet * 2)} · Secured on Solana
          </span>
        </div>
      ) : (
        <div className="text-micro flex items-center justify-center gap-2 text-muted-foreground">
          <span className="font-semibold text-neon">±{MMR_STAKE} MMR</span>
          <span>·</span>
          <span>Best of 1</span>
          <span>·</span>
          <span>Ranked</span>
        </div>
      )}
    </div>
  );
}

/** Brief confirmation before routing into the duel. */
function AcceptedView() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-neon/15 text-neon">
        <Check className="size-7" weight="bold" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Both players ready</span>
        <span className="text-micro text-muted-foreground">Spinning up the 1v1 arena…</span>
      </div>
    </div>
  );
}
