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
import { HoloPlayerCard } from '@/components/store/holo-player-card';
import { useMarketStore } from '@/store/market.store';
import { useBalance } from '@/store/wallet.store';
import { useRequireAuth } from '@/services/queries/use-require-auth';
import { formatThousands } from '@/lib/format';
import type { Listing } from '@/config/market-listings.config';

/** Confirm-purchase dialog for a market listing. */
export function BuyDialog({ listing, onOpenChange }: { listing: Listing | null; onOpenChange: (open: boolean) => void }) {
  const buy = useMarketStore((s) => s.buy);
  const balance = useBalance();
  const requireAuth = useRequireAuth();

  const confirm = () => {
    if (!listing) return;
    if (!requireAuth()) return;
    if (buy(listing.id)) {
      toast.success(`Bought ${listing.card.name}.`);
      onOpenChange(false);
    } else {
      toast.error('Not enough coins for this player.');
    }
  };

  return (
    <Dialog open={Boolean(listing)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Buy player</DialogTitle>
          <DialogDescription>Coins move from your play-money balance (devnet).</DialogDescription>
        </DialogHeader>
        {listing && (
          <div className="flex flex-col items-center gap-3 py-2">
            <HoloPlayerCard {...listing.card} width={150} />
            <span className="font-bold">{listing.card.name}</span>
            <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-neon">
              <Image src="/coin.png" alt="" width={14} height={14} className="size-3.5" />
              {formatThousands(listing.price)}
            </span>
            <span className="text-micro text-muted-foreground">{formatThousands(balance)} available</span>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={!listing || balance < (listing?.price ?? 0)}>
            Confirm buy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
