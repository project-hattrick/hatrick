'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PackOpening } from '@/components/store/pack-opening';
import { PackBuyDialog } from '@/components/store/pack-buy-dialog';
import { OddsButton } from '@/components/store/drop-rates-dialog';
import { useItemStock, usePurchaseItem } from '@/services/queries/use-store-item';
import { cn } from '@/lib/utils';

/** Minimum settling beat between confirm and the opening overlay — a real purchase feels like a transaction. */
const PROCESSING_MS = 650;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface BuyPackFlowProps {
  /** Store catalog slug — drives stock and the purchase call. */
  slug: string;
  packName: string;
  /** Cards drawn per opening. */
  packSize: number;
  /** Display price (e.g. "2.0 SOL") — shown in the confirm modal. */
  price: string;
  /** Optional one-liner describing the pack. */
  tagline?: string;
  /** Primary button content (coin icon + price). */
  cta: ReactNode;
  ctaClassName?: string;
  ctaSize?: ComponentProps<typeof Button>['size'];
  ctaVariant?: ComponentProps<typeof Button>['variant'];
  /** Render the secondary "Odds" action next to Buy. */
  showOdds?: boolean;
  /** Fade the odds action in only on card hover (compact tiles). */
  oddsReveal?: boolean;
  /** Layout for the actions row (defaults to an inline gap). */
  actionsClassName?: string;
}

/** Buy button → purchase-confirm modal → real purchase (stock claim + debit) → pack-opening flow. */
export function BuyPackFlow({
  slug,
  packName,
  packSize,
  price,
  tagline,
  cta,
  ctaClassName,
  ctaSize,
  ctaVariant,
  showOdds = false,
  oddsReveal = false,
  actionsClassName,
}: BuyPackFlowProps) {
  const [confirming, setConfirming] = useState(false);
  const [opening, setOpening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const purchase = usePurchaseItem();
  const stock = useItemStock(slug);
  const soldOut = stock !== undefined && stock <= 0;

  const confirm = async () => {
    setProcessing(true);
    // Keep the settling beat even when the server answers instantly.
    const [ok] = await Promise.all([purchase(slug), delay(PROCESSING_MS)]);
    setProcessing(false);
    if (!ok) return; // reason already toasted — keep the dialog open
    setConfirming(false);
    setOpening(true);
  };

  return (
    <>
      <div className={cn('flex items-center gap-2', actionsClassName)}>
        <Button
          variant={ctaVariant}
          size={ctaSize}
          className={ctaClassName}
          disabled={soldOut}
          onClick={() => setConfirming(true)}
        >
          {soldOut ? 'Sold out' : cta}
        </Button>
        {showOdds && !soldOut && (
          <OddsButton
            packName={packName}
            reveal={oddsReveal}
            size={ctaSize === 'lg' ? 'lg' : 'sm'}
            variant={oddsReveal ? 'ghost' : 'outline'}
          />
        )}
      </div>

      <PackBuyDialog
        open={confirming}
        onOpenChange={setConfirming}
        packName={packName}
        packSize={packSize}
        price={price}
        tagline={tagline}
        processing={processing}
        onConfirm={() => void confirm()}
      />

      <PackOpening open={opening} onClose={() => setOpening(false)} hideTrigger packName={packName} packSize={packSize} />
    </>
  );
}
