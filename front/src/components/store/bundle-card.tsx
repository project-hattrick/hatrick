'use client';

import { useRef, useState } from 'react';
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
import { MetalButton } from '@/components/ui/metal-button';
import { StoreBadge, BadgeTone } from '@/components/store/store-badge';
import { INTERACTIVE_CARD } from '@/components/store/interactive-card';
import { ItemShowcase } from '@/components/store/item-showcase';
import { PackOpening } from '@/components/store/pack-opening';
import { useItemStock, usePurchaseItem } from '@/services/queries/use-store-item';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { BundleTrait, type Bundle } from '@/config/store-bundles.config';
import { useFantasyStore } from '@/store/fantasy.store';
import type { CollectionCard } from '@/services/fantasy.service';
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
const BUNDLE_PACK_SIZE = 5;

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
  const [opening, setOpening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hasPurchasedDeck, setHasPurchasedDeck] = useState(false);
  const purchasedCards = useRef<CollectionCard[] | null>(null);
  const { slug, name, caption, price, trait, tag } = bundle;
  const traitMeta = TRAIT_META[trait];
  const purchase = usePurchaseItem();
  const stock = useItemStock(slug);
  const soldOut = stock !== undefined && stock <= 0;
  // Signed out → open the login dialog (same as the navbar) instead of the confirm modal.
  const gate = useAuthGate();

  const buy = async () => {
    setProcessing(true);
    const result = await purchase(slug);
    setProcessing(false);
    if (!result.ok) return; // reason already toasted — keep the dialog open
    purchasedCards.current = result.cards ?? null;
    setHasPurchasedDeck(Boolean(result.cards?.length));
    if (result.cards?.length) useFantasyStore.getState().addToCollection(result.cards);
    setConfirming(false);
    setOpening(true);
  };

  const resolvePurchasedDeck = async () => {
    const cards = purchasedCards.current;
    if (!cards?.length) throw new Error('No purchased cards available');
    return cards;
  };

  const complete = (cards: CollectionCard[]) => {
    useFantasyStore.getState().addToCollection(cards);
    purchasedCards.current = null;
    setHasPurchasedDeck(false);
    toast.success(`${name} added ${cards.length} players to your collection.`);
  };

  return (
    <>
      <button
        type="button"
        disabled={soldOut}
        onClick={gate(() => setConfirming(true))}
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
              {tag && !soldOut && <StoreBadge tone={tag.tone}>{tag.text}</StoreBadge>}
              {stock !== undefined && (
                <StoreBadge tone={soldOut ? BadgeTone.Info : BadgeTone.Value}>
                  {soldOut ? 'Sold out' : `${stock} left`}
                </StoreBadge>
              )}
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

      <Dialog open={confirming} onOpenChange={(next) => !processing && setConfirming(next)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm purchase</DialogTitle>
            <DialogDescription>Coins move from your play-money balance (devnet).</DialogDescription>
          </DialogHeader>
          <ItemShowcase>
            <PackFan packClassName="h-28" />
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg leading-tight font-black uppercase">{name}</span>
              <p className="max-w-xs text-caption text-muted-foreground">{caption}</p>
            </div>
            <span className="flex items-center gap-2 font-mono text-lead font-bold text-neon">
              <Image src="/coin.png" alt="" width={18} height={18} className="size-4.5" />
              {price}
            </span>
          </ItemShowcase>
          <DialogFooter>
            <Button variant="outline" size="lg" className="h-11 flex-none px-6" onClick={() => setConfirming(false)} disabled={processing}>
              Cancel
            </Button>
            <MetalButton
              preset="chromatic"
              strength={1}
              ringCssPx={3}
              size="lg"
              metalFxClassName="visible! w-full flex-1 opacity-100!"
              onClick={() => void buy()}
              disabled={processing}
              className="h-11 w-full px-8 text-sm font-bold"
            >
              {processing ? 'Processing...' : 'Confirm buy'}
            </MetalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PackOpening
        open={opening}
        onClose={() => {
          setOpening(false);
          setHasPurchasedDeck(false);
        }}
        hideTrigger
        packName={name}
        packSize={BUNDLE_PACK_SIZE}
        onComplete={complete}
        resolveDeck={hasPurchasedDeck ? resolvePurchasedDeck : undefined}
      />
    </>
  );
}
