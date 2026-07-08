'use client';

import { useState } from 'react';
import { Percent } from '@/components/common/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { REVEAL_ON_HOVER } from '@/components/store/interactive-card';
import { cn } from '@/lib/utils';

interface DropRate {
  label: string;
  chance: string;
  /** Dot colour — matches the pull-rarity accents in pack-opening. */
  dot: string;
}

/** Mock provably-fair odds — same rarity ladder the opening flow renders. */
const DROP_RATES: DropRate[] = [
  { label: 'Common', chance: '60%', dot: 'bg-muted-foreground' },
  { label: 'Rare', chance: '27%', dot: 'bg-info' },
  { label: 'Epic', chance: '10%', dot: 'bg-[#b58aff]' },
  { label: 'Legendary', chance: '3%', dot: 'bg-[#e1b84b]' },
];

/** Rarity-odds breakdown for a pack. */
export function DropRatesDialog({
  open,
  onOpenChange,
  packName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Drop rates</DialogTitle>
          <DialogDescription>{packName} · provably fair odds (devnet).</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {DROP_RATES.map((rate) => (
            <li
              key={rate.label}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-surface-1/60 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className={cn('size-2 rounded-full', rate.dot)} />
                {rate.label}
              </span>
              <span className="font-mono text-sm font-bold text-foreground">{rate.chance}</span>
            </li>
          ))}
        </ul>
        <p className="text-micro text-muted-foreground">Odds are illustrative for the devnet demo.</p>
      </DialogContent>
    </Dialog>
  );
}

/** Self-contained "Odds" button that pops the drop-rates dialog — pass `reveal` to fade it in on card hover. */
export function OddsButton({
  packName,
  reveal = false,
  size = 'sm',
  variant = 'ghost',
  className,
}: {
  packName: string;
  reveal?: boolean;
  size?: React.ComponentProps<typeof Button>['size'];
  variant?: React.ComponentProps<typeof Button>['variant'];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={cn(reveal && REVEAL_ON_HOVER, className)}
      >
        <Percent className="size-3.5" weight="bold" />
        Odds
      </Button>
      <DropRatesDialog open={open} onOpenChange={setOpen} packName={packName} />
    </>
  );
}
