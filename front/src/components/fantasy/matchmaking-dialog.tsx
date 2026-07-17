'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CountdownRing } from '@/components/live/countdown-ring';
import { Flag } from '@/components/common/flag';
import { DuelistCard } from './duelist-card';
import { formatTokens } from './bet-selector';
import { Sword, Check, Lightning, Coins, ShieldCheck } from '@/components/common/icons';
import { MatchPhase } from '@/enums/match-phase.enum';
import { fifaToIso } from '@/lib/country';
import { duelists } from '@/config/duelists.config';
import { useSelfProfile } from '@/hooks/use-self-identity';
import { useDuelStore } from '@/store/duel.store';
import { useFantasyStore } from '@/store/fantasy.store';
import { duelService } from '@/services/fantasy.service';
import { backendEnabled } from '@/services/session-mode';
import {
  ACCEPT_SECONDS,
  MMR_STAKE,
  SEARCH_MS,
  START_SECONDS,
  opponentDuelist,
  opponentRoster,
  rankTierConfig,
  selfRoster,
  type Duelist,
  type RosterEntry,
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
  [MatchPhase.Accepted]: { title: 'Match ready', description: 'Rosters locked — kickoff in a moment.' },
};

/**
 * Ranked-duel matchmaking modal — a phase-driven flow (searching → opponent found →
 * accepted) on the shared Dialog shell, mirroring the login-dialog step pattern.
 * Backend sessions use the real ranked queue; mock sessions keep the local timer.
 */
export function MatchmakingDialog({ open, onOpenChange, opponent, bet, onConfirm }: MatchmakingDialogProps) {
  const router = useRouter();
  const self = useSelfProfile();
  const startDuel = useDuelStore((s) => s.start);
  const confirmSetup = useDuelStore((s) => s.confirmSetup);

  const isChallenge = Boolean(opponent);
  const activeOpponent = opponent ?? opponentDuelist;
  const openPhase = isChallenge ? MatchPhase.Found : MatchPhase.Searching;

  const [phase, setPhase] = useState(openPhase);
  const [seconds, setSeconds] = useState(ACCEPT_SECONDS);
  const [elapsed, setElapsed] = useState(0);
  const [startIn, setStartIn] = useState(START_SECONDS);
  const [wasOpen, setWasOpen] = useState(false);
  const queuedRef = useRef(false);

  // Reset the flow each time the dialog opens — adjust state during render (not in an effect).
  if (open && !wasOpen) {
    setWasOpen(true);
    setPhase(openPhase);
    setSeconds(ACCEPT_SECONDS);
    setElapsed(0);
    setStartIn(START_SECONDS);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const enterMatch = () => {
    if (isChallenge) {
      // Direct challenge: the mount owns the duel start (routes into the XI setup step).
      onConfirm?.();
      onOpenChange(false);
      return;
    }
    // Ranked: the mocked queue always matches the same profile — skip XI setup, straight to the pitch.
    const profile = duelists.find((d) => d.name === opponentDuelist.name) ?? duelists[0];
    startDuel(profile.username, profile);
    confirmSetup();
    onOpenChange(false);
    router.push(`/duel/${profile.username}`);
  };

  // Backend ranked queue: send the current XI once and wait for duel:ready.
  useEffect(() => {
    if (!open || isChallenge || !backendEnabled) return;

    const fantasy = useFantasyStore.getState();
    const ownedCardIds = fantasy.squad
      .map((i) => fantasy.collection[i]?.ownedCardId)
      .filter(Boolean) as string[];

    if (!ownedCardIds.length) {
      toast.error('Build your XI in Fantasy before entering matchmaking.');
      onOpenChange(false);
      return;
    }

    let cancelled = false;
    queuedRef.current = true;

    void duelService
      .enterMatchmaking({ formation: fantasy.formation, ownedCardIds })
      .catch((err) => {
        if (cancelled) return;
        toast.error((err as Error)?.message ?? 'Failed to enter matchmaking');
        onOpenChange(false);
      });

    return () => {
      cancelled = true;
      if (!queuedRef.current) return;
      queuedRef.current = false;
      void duelService.leaveMatchmaking().catch(() => {});
    };
  }, [open, isChallenge, onOpenChange]);

  // Searching: count up; mock sessions also flip to "found" after a short scan.
  useEffect(() => {
    if (!open || phase !== MatchPhase.Searching) return;
    const found = backendEnabled ? null : window.setTimeout(() => setPhase(MatchPhase.Found), SEARCH_MS);
    const tick = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (found) window.clearTimeout(found);
      window.clearInterval(tick);
    };
  }, [open, phase]);

  // Found: the ready-check countdown empties toward 0.
  useEffect(() => {
    if (!open || phase !== MatchPhase.Found) return;
    const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [open, phase]);

  // Accepted: kickoff countdown — auto-enters the match when it hits 0.
  useEffect(() => {
    if (!open || phase !== MatchPhase.Accepted) return;
    if (startIn === 0) {
      enterMatch();
      return;
    }
    const id = window.setTimeout(() => setStartIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- enterMatch is stable per render inputs
  }, [open, phase, startIn]);

  const heading =
    isChallenge && phase === MatchPhase.Found
      ? { title: `Challenging ${activeOpponent.name}`, description: 'Ready check — accept to enter the arena.' }
      : HEADINGS[phase];
  const expired = seconds === 0;
  const selfTier = rankTierConfig[self.tier];

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
            <SearchingView self={self} elapsed={elapsed} tier={`${selfTier.label} ${self.division}`} rating={self.rating} />
          ) : phase === MatchPhase.Found ? (
            <FoundView self={self} seconds={seconds} opponent={activeOpponent} bet={isChallenge ? bet : undefined} />
          ) : (
            <AcceptedView self={self} opponent={activeOpponent} startIn={startIn} />
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
            <Button shape="pill" className="w-full gap-2 sm:w-auto" onClick={enterMatch}>
              <Lightning className="size-4" weight="fill" />
              Enter now · {startIn}s
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Radar scan over the player's portrait while queueing. */
function SearchingView({ self, elapsed, tier, rating }: { self: Duelist; elapsed: number; tier: string; rating: number }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative grid size-28 place-items-center">
        <span className="absolute size-28 animate-ping rounded-full border border-neon/25" />
        <span className="absolute size-20 animate-ping rounded-full border border-neon/20 [animation-delay:500ms]" />
        <span className="absolute size-28 rounded-full border border-border" />
        <span className="relative grid size-16 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-white/10">
          <Image
            src={self.portraitSrc}
            alt={self.name}
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
  self,
  seconds,
  opponent,
  bet,
}: {
  self: Duelist;
  seconds: number;
  opponent: Duelist;
  /** Token stake picked in the entry modal — set only on direct challenges; ranked queue stays MMR-only. */
  bet?: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <DuelistCard duelist={self} highlight />
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

/** One team on the pre-kickoff reveal — portrait, name and headline roster. */
function RosterSide({ duelist, roster, highlight }: { duelist: Duelist; roster: RosterEntry[]; highlight?: boolean }) {
  return (
    <div
      className={
        highlight
          ? 'flex flex-col items-center gap-2 rounded-2xl border border-neon/40 bg-neon/[0.05] p-3'
          : 'flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-2/60 p-3'
      }
    >
      <span className="relative grid size-14 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-white/10">
        <Image
          src={duelist.portraitSrc}
          alt={duelist.name}
          width={56}
          height={56}
          className="translate-y-[6%] scale-110 object-contain object-bottom"
          style={{ imageRendering: 'pixelated' }}
        />
      </span>
      <span className="flex items-center gap-1.5">
        <Flag code={fifaToIso(duelist.country)} className="text-xs" />
        <span className="max-w-[7.5rem] truncate text-sm font-bold">{duelist.name}</span>
      </span>
      <ul className="flex w-full flex-col gap-1">
        {roster.map((entry) => (
          <li key={entry.name} className="text-micro flex items-center justify-between gap-2">
            <span className="truncate text-muted-foreground">{entry.name}</span>
            <span className="font-mono font-bold tabular-nums text-neon">{entry.rating}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pre-kickoff reveal — both rosters face to face while the start timer runs down. */
function AcceptedView({ self, opponent, startIn }: { self: Duelist; opponent: Duelist; startIn: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <RosterSide duelist={self} roster={selfRoster} highlight />
        <div className="flex flex-col items-center justify-center gap-2 px-0.5">
          <span className="neon-text font-heading text-2xl font-black tracking-tight text-neon">VS</span>
          <CountdownRing seconds={startIn} max={START_SECONDS} label="Kickoff countdown" />
        </div>
        <RosterSide duelist={opponent} roster={opponentRoster} />
      </div>
      <p className="text-micro text-center text-muted-foreground">
        Kickoff in <span className="font-mono font-bold text-neon">{startIn}s</span> — entering the pitch automatically.
      </p>
    </div>
  );
}
