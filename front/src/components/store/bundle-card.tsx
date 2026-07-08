'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { ShoppingCart } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
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
import { INTERACTIVE_CARD, REVEAL_ON_HOVER } from '@/components/store/interactive-card';
import { cn } from '@/lib/utils';

export interface BundleTag {
  text: string;
  tone: BadgeTone;
}

export interface Bundle {
  name: string;
  caption: string;
  price: string;
  tag?: BundleTag;
  soldOut?: boolean;
}

/** Fanned pack thumbnails — tilted like a spread hand. */
const PACK_ROTATIONS = ['-rotate-12', '', 'rotate-12'];

/** A buyable bundle tile — hover reveals the CTA + a neon wash; confirms in a modal. */
export function BundleCard({ bundle }: { bundle: Bundle }) {
  const [confirming, setConfirming] = useState(false);
  const { name, caption, price, tag, soldOut } = bundle;

  const buy = () => {
    setConfirming(false);
    toast.success(`${name} purchased.`);
  };

  return (
    <>
      <GlassPanel
        radius="lg"
        tone="dark"
        className={cn('relative flex items-center gap-3 overflow-hidden p-5', soldOut ? 'opacity-55' : INTERACTIVE_CARD)}
      >
        {/* Neon wash from the right on hover */}
        {!soldOut && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(174,240,25,0.10),transparent_45%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
        )}

        <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-title uppercase">{name}</h3>
            {tag && <StoreBadge tone={tag.tone}>{tag.text}</StoreBadge>}
            {soldOut && <StoreBadge tone={BadgeTone.Info}>Sold out</StoreBadge>}
          </div>
          <p className="text-caption text-muted-foreground">{caption}</p>
          <span className="mt-0.5 flex items-center gap-1.5 text-body font-bold">
            <Image src="/coin.png" alt="" width={16} height={16} className="size-4" />
            {price}
          </span>
          <Button
            size="sm"
            className={cn('mt-2 w-fit gap-1.5', !soldOut && REVEAL_ON_HOVER)}
            disabled={soldOut}
            onClick={() => setConfirming(true)}
          >
            <ShoppingCart className="size-3.5" weight="bold" />
            {soldOut ? 'Sold out' : 'Buy bundle'}
          </Button>
        </div>

        {/* Decorative fanned packs */}
        <div className="relative flex shrink-0 items-center [perspective:800px]">
          {PACK_ROTATIONS.map((rot, i) => (
            <Image
              key={i}
              src="/cards/pack-foil.png"
              alt=""
              width={660}
              height={1122}
              className={cn(
                'h-24 w-auto shrink-0 drop-shadow-[0_14px_24px_rgba(0,0,0,0.65)] transition-transform duration-200 ease-out',
                rot,
                i > 0 && '-ml-10',
                i === 1 && 'z-10 scale-110',
                !soldOut && 'group-hover:scale-[1.06]',
              )}
            />
          ))}
        </div>
      </GlassPanel>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm purchase</DialogTitle>
            <DialogDescription>Coins move from your play-money balance (devnet).</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <div className="flex items-end [perspective:800px]">
              {PACK_ROTATIONS.map((rot, i) => (
                <Image
                  key={i}
                  src="/cards/pack-foil.png"
                  alt=""
                  width={660}
                  height={1122}
                  className={cn('h-24 w-auto shrink-0 drop-shadow-[0_14px_24px_rgba(0,0,0,0.65)]', rot, i > 0 && '-ml-9', i === 1 && 'z-10 scale-110')}
                />
              ))}
            </div>
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
