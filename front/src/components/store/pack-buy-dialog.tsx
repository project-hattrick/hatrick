'use client';

import Image from 'next/image';
import { CircleNotch } from '@/components/common/icons';
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
import { ParallaxPack } from '@/components/store/parallax-pack';
import { ItemShowcase } from '@/components/store/item-showcase';

interface PackBuyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packName: string;
  /** Cards drawn per opening. */
  packSize: number;
  /** Display price (e.g. "2.0 SOL"). */
  price: string;
  /** Optional one-liner describing the pack. */
  tagline?: string;
  /** Fired when the player confirms — the seam to start the opening flow. */
  onConfirm: () => void;
  /** Post-confirm settling state — swaps the CTA for a spinner and locks the dialog. */
  processing?: boolean;
}

/** Confirm-purchase dialog for a store pack — the pack staged on the opening podium. */
export function PackBuyDialog({
  open,
  onOpenChange,
  packName,
  packSize,
  price,
  tagline,
  onConfirm,
  processing = false,
}: PackBuyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !processing && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm purchase</DialogTitle>
          <DialogDescription>Coins move from your play-money balance (devnet).</DialogDescription>
        </DialogHeader>
        <ItemShowcase>
          <ParallaxPack className="h-44" glow />
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-lg leading-tight font-black uppercase">{packName}</span>
            <span className="text-caption text-muted-foreground">{packSize} players guaranteed</span>
            {tagline && <p className="max-w-xs text-caption text-muted-foreground">{tagline}</p>}
          </div>
          <span className="flex items-center gap-2 font-mono text-lead font-bold text-neon">
            <Image src="/coin.png" alt="" width={18} height={18} className="size-4.5" />
            {price}
          </span>
        </ItemShowcase>
        <DialogFooter>
          <Button variant="outline" size="lg" className="h-11 flex-none px-6" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancel
          </Button>
          <MetalButton
            preset="chromatic"
            strength={1}
            ringCssPx={3}
            size="lg"
            metalFxClassName="visible! w-full flex-1 opacity-100!"
            onClick={onConfirm}
            disabled={processing}
            className="h-11 w-full px-8 text-sm font-bold"
          >
            {processing ? (
              <>
                <CircleNotch className="size-4 animate-spin" weight="bold" />
                Processing…
              </>
            ) : (
              'Confirm & open'
            )}
          </MetalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
