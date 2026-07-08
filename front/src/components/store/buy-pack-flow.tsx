'use client';

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PackOpening } from '@/components/store/pack-opening';
import { PackBuyDialog } from '@/components/store/pack-buy-dialog';
import { OddsButton } from '@/components/store/drop-rates-dialog';
import { cn } from '@/lib/utils';

/** Short settling beat between confirm and the opening overlay — makes the buy feel like a real transaction. */
const PROCESSING_MS = 650;

interface BuyPackFlowProps {
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
  /** Disabled, out-of-stock state. */
  soldOut?: boolean;
  /** Layout for the actions row (defaults to an inline gap). */
  actionsClassName?: string;
}

/** Buy button → purchase-confirm modal → processing → pack-opening flow, with an optional odds action. */
export function BuyPackFlow({
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
  soldOut = false,
  actionsClassName,
}: BuyPackFlowProps) {
  const [confirming, setConfirming] = useState(false);
  const [opening, setOpening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  const confirm = () => {
    setProcessing(true);
    timer.current = setTimeout(() => {
      setProcessing(false);
      setConfirming(false);
      setOpening(true);
    }, PROCESSING_MS);
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
        onConfirm={confirm}
      />

      <PackOpening open={opening} onClose={() => setOpening(false)} hideTrigger packName={packName} packSize={packSize} />
    </>
  );
}
