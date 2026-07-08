'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { ArrowsLeftRight, Lightning, Sparkle, TrendUp, Users, type Icon } from '@/components/common/icons';
import { glassPanelVariants } from '@/components/common/glass-panel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StoreBadge, BadgeTone } from '@/components/store/store-badge';
import { INTERACTIVE_CARD } from '@/components/store/interactive-card';
import { BundleTrait, type Bundle } from '@/config/store-bundles.config';
import { cn } from '@/lib/utils';

/** Same backdrop as the Legendary Pack card / pack-opening stage. */
const BUNDLE_BG = "url('/cards/stadium-podium.png')";

const TRAIT_META: Record<BundleTrait, { icon: Icon; label: string }> = {
  [BundleTrait.HighOdds]: { icon: TrendUp, label: 'High odds' },
  [BundleTrait.Balanced]: { icon: ArrowsLeftRight, label: 'Balanced' },
  [BundleTrait.HighUpside]: { icon: Lightning, label: 'High upside' },
};

/** Fanned pack thumbnails — the spread-hand stack from the pack-buy modal. */
const PACK_ROTATIONS = ['-rotate-12', '', 'rotate-12'];

export function PackFan({ className, packClassName = 'h-24' }: { className?: string; packClassName?: string }) {
  return (
    <div className={cn('flex items-end [perspective:800px]', className)}>
      {PACK_ROTATIONS.map((rot, i) => (
        <Image
          key={i}
          src="/cards/pack-foil.png"
          alt=""
          width={660}
          height={1122}
          className={cn(
            'w-auto shrink-0 drop-shadow-[0_14px_24px_rgba(0,0,0,0.65)]',
            packClassName,
            rot,
            i > 0 && '-ml-9',
            i === 1 && 'z-10 scale-110',
          )}
        />
      ))}
    </div>
  );
}

function MetaItem({ icon: MetaIcon, label }: { icon: Icon; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-caption font-semibold tracking-wide text-muted-foreground uppercase">
      <MetaIcon className="size-3.5 text-neon" weight="bold" />
      {label}
    </span>
  );
}

/**
 * A buyable bundle tile over the pack-opening stage backdrop: copy on the shaded
 * left, the fanned pack stack over the revealed stage on the right. The whole
 * card opens the confirm modal. Sized for the bundles carousel.
 */
export function BundleCard({ bundle }: { bundle: Bundle }) {
  const [confirming, setConfirming] = useState(false);
  const { name, caption, price, trait, tag, soldOut } = bundle;
  const traitMeta = TRAIT_META[trait];

  const buy = () => {
    setConfirming(false);
    toast.success(`${name} purchased.`);
  };

  return (
    <>
      <button
        type="button"
        disabled={soldOut}
        onClick={() => setConfirming(true)}
        style={{ backgroundImage: BUNDLE_BG }}
        className={cn(
          glassPanelVariants({ tone: 'dark', radius: 'lg' }),
          'relative overflow-hidden bg-cover bg-right p-6 text-left',
          soldOut ? 'opacity-55' : cn(INTERACTIVE_CARD, 'cursor-pointer border-warning/30'),
        )}
      >
        {/* Directional fade (L→R): a whisper of the stage behind the fan, near-solid under the copy. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-overlay/70 via-overlay/90 to-overlay" />

        <div className="relative z-10 flex items-center gap-5">
          <PackFan
            packClassName="h-24"
            className="shrink-0 transition-transform duration-200 group-hover:scale-[1.05]"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-title uppercase">{name}</h3>
              {tag && <StoreBadge tone={tag.tone}>{tag.text}</StoreBadge>}
              {soldOut && <StoreBadge tone={BadgeTone.Info}>Sold out</StoreBadge>}
            </div>
            <p className="text-body text-muted-foreground">{caption}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <MetaItem icon={Users} label="5 players" />
              <MetaItem icon={Sparkle} label="1 rare+" />
              <MetaItem icon={traitMeta.icon} label={traitMeta.label} />
            </div>
            <span className="mt-1.5 flex w-fit items-center gap-1.5 rounded-full border border-border bg-overlay/50 px-3.5 py-1 text-body font-bold transition-colors group-hover:border-foreground/40">
              <Image src="/coin.png" alt="" width={16} height={16} className="size-4" />
              {price}
            </span>
          </div>
        </div>
      </button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm purchase</DialogTitle>
            <DialogDescription>Coins move from your play-money balance (devnet).</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <PackFan />
            <span className="mt-1 text-lg font-black uppercase">{name}</span>
            <p className="max-w-xs text-caption text-muted-foreground">{caption}</p>
            <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-neon">
              <Image src="/coin.png" alt="" width={14} height={14} className="size-3.5" />
              {price}
            </span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button onClick={buy}>Confirm buy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
