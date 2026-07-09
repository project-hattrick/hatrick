'use client';

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
import { MetalButton } from '@/components/ui/metal-button';
import { HoloPlayerCard } from '@/components/store/holo-player-card';
import { ItemShowcase } from '@/components/store/item-showcase';
import { usePurchaseItem } from '@/services/queries/use-store-item';
import { rarityFor, RARITY_THEME } from '@/config/card-rarity.config';
import { pickSlug } from '@/config/store-catalog.config';
import { statOrder, type PlayerCardData } from '@/config/fantasy-cards.config';
import { useFantasyStore } from '@/store/fantasy.store';
import { cn } from '@/lib/utils';

/** Confirm-purchase dialog for a market pick — the holo card staged with its rarity glow. */
export function PickBuyDialog({
  open,
  onOpenChange,
  card,
  price,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: PlayerCardData;
  price: string;
}) {
  const rarity = rarityFor(card.rating);
  const theme = RARITY_THEME[rarity];
  const purchase = usePurchaseItem();

  const buy = async () => {
    const ok = await purchase(pickSlug(card.id));
    if (!ok) return; // reason already toasted — keep the dialog open
    // The bought star lands in the fantasy collection (same seam as a market buy).
    useFantasyStore.getState().addToCollection([
      {
        name: card.name,
        number: card.rating,
        flag: card.flag,
        holoColors: card.holoColors,
        portraitSrc: card.portraitSrc,
        position: card.position,
        code: card.code,
        stats: statOrder.map(([label, key]) => ({ label, value: card.stats[key] })),
      },
    ]);
    onOpenChange(false);
    toast.success(`${card.name} purchased.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm purchase</DialogTitle>
          <DialogDescription>Coins move from your play-money balance (devnet).</DialogDescription>
        </DialogHeader>
        <ItemShowcase glowColor={theme.tint} className={theme.tileClass || undefined}>
          <HoloPlayerCard
            number={card.rating}
            flag={card.flag}
            portraitSrc={card.portraitSrc}
            holoColors={card.holoColors}
            surfaceColors={theme.surfaceColors}
            surfaceShine={theme.surfaceShine}
            stats={statOrder.map(([label, key]) => ({ label, value: card.stats[key] }))}
            width={200}
          />
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-lg leading-tight font-black uppercase">
              {card.name} <span className="font-semibold text-muted-foreground">{card.position}</span>
            </span>
            <span className={cn('text-eyebrow', theme.badgeClass)}>{theme.label}</span>
          </div>
          <span className="flex items-center gap-2 font-mono text-lead font-bold text-neon">
            <Image src="/coin.png" alt="" width={18} height={18} className="size-4.5" />
            {price}
          </span>
        </ItemShowcase>
        <DialogFooter>
          <Button variant="outline" size="lg" className="h-11 flex-none px-6" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <MetalButton
            preset="chromatic"
            strength={1}
            ringCssPx={3}
            size="lg"
            metalFxClassName="visible! w-full flex-1 opacity-100!"
            onClick={() => void buy()}
            className="h-11 w-full px-8 text-sm font-bold"
          >
            Confirm buy
          </MetalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
