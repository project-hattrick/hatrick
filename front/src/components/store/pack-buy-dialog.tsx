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
import { ParallaxPack } from '@/components/store/parallax-pack';

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

/** Confirm-purchase dialog for a store pack — shows the pack, its size and price before opening. */
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm purchase</DialogTitle>
          <DialogDescription>Coins move from your play-money balance (devnet).</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <ParallaxPack className="h-40" glow />
          <span className="text-lg font-black uppercase">{packName}</span>
          <span className="text-caption text-muted-foreground">{packSize} players guaranteed</span>
          {tagline && <p className="max-w-xs text-caption text-muted-foreground">{tagline}</p>}
          <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-neon">
            <Image src="/coin.png" alt="" width={14} height={14} className="size-3.5" />
            {price}
          </span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={processing}>
            {processing ? (
              <>
                <CircleNotch className="size-4 animate-spin" weight="bold" />
                Processing…
              </>
            ) : (
              'Confirm & open'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
