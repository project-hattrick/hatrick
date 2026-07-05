'use client';

import Image from 'next/image';

import { FormationPitch } from '@/components/home/widgets/formation-pitch';
import { formatTokens } from '@/components/fantasy/bet-selector';
import { Flag } from '@/components/common/flag';
import { Coins, Lightning, ShieldCheck } from '@/components/common/icons';
import { Button } from '@/components/ui/button';
import { fifaToIso } from '@/lib/country';
import { selfProfile, type PlayerProfile } from '@/config/duelists.config';
import { useDuelStore } from '@/store/duel.store';
import { cn } from '@/lib/utils';

function SideIdentity({ player, align }: { player: PlayerProfile; align: 'left' | 'right' }) {
  return (
    <div className={`flex items-center gap-2.5 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className="relative grid size-10 shrink-0 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-white/10">
        <Image
          src={player.portraitSrc}
          alt={player.name}
          width={40}
          height={40}
          className="translate-y-[6%] scale-110 object-contain object-bottom"
          style={{ imageRendering: 'pixelated' }}
        />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={`flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          <Flag code={fifaToIso(player.country)} className="text-xs" />
          <span className="truncate text-sm font-bold">{player.name}</span>
        </span>
        <span className="text-micro text-muted-foreground">{player.rating} MMR</span>
      </span>
    </div>
  );
}

/**
 * Pre-match setup step on /duel/[id] — build your XI and lock the formation
 * before the arena spins up. Shown while duel.store.inSetup is true.
 */
interface DuelSetupProps {
  embedded?: boolean;
  onConfirm?: () => void;
}

export function DuelSetup({ embedded = false, onConfirm }: DuelSetupProps) {
  const opponent = useDuelStore((s) => s.opponent);
  const bet = useDuelStore((s) => s.bet);
  const confirmSetup = useDuelStore((s) => s.confirmSetup);

  if (!opponent) return null;

  const handleConfirm = () => {
    confirmSetup();
    onConfirm?.();
  };

  return (
    <div className={cn('mx-auto flex w-full max-w-2xl flex-col gap-4', embedded ? 'py-1' : 'px-4 py-6')}>
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <SideIdentity player={selfProfile} align="left" />
          <span className="neon-text font-heading text-xl font-black tracking-tight text-neon">VS</span>
          <SideIdentity player={opponent} align="right" />
        </div>
        {bet !== null && (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-neon/25 bg-neon/[0.05] px-4 py-2">
            <span className="flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums text-neon">
              <Coins className="size-4" weight="fill" />
              {formatTokens(bet)} tokens each
            </span>
            <span className="text-micro flex items-center gap-1 text-muted-foreground">
              <ShieldCheck className="size-3.5 text-neon" />
              Winner takes {formatTokens(bet * 2)} · Secured on Solana
            </span>
          </div>
        )}
      </header>

      <FormationPitch />

      <Button size="lg" shape="pill" className="w-full gap-2 font-semibold" onClick={handleConfirm}>
        <Lightning className="size-4" weight="fill" />
        Lock XI & enter the pitch
      </Button>
    </div>
  );
}
