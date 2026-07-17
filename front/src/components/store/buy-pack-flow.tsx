'use client';

import { useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PackOpening } from '@/components/store/pack-opening';
import { PackBuyDialog } from '@/components/store/pack-buy-dialog';
import { OddsButton } from '@/components/store/drop-rates-dialog';
import { useItemStock, usePurchaseItem } from '@/services/queries/use-store-item';
import { useOpenPackOnChain } from '@/services/queries/use-open-pack-on-chain';
import { isChainSession } from '@/services/session-mode';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { useFantasyStore } from '@/store/fantasy.store';
import type { CollectionCard } from '@/services/fantasy.service';
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
  /**
   * On-chain pack open: template id (maps to the pack variant on-chain) and pack
   * type (e.g. 'Standard'). When provided AND `isChainSession()` is true, the
   * pack-opening resolver mints real cNFTs instead of drawing from the mock pool.
   */
  chainTemplateId?: string;
  chainPackType?: string;
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
  chainTemplateId,
  chainPackType,
}: BuyPackFlowProps) {
  const [confirming, setConfirming] = useState(false);
  const [opening, setOpening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hasPurchasedDeck, setHasPurchasedDeck] = useState(false);
  const purchasedCards = useRef<CollectionCard[] | null>(null);
  const purchase = usePurchaseItem();
  const stock = useItemStock(slug);
  const soldOut = stock !== undefined && stock <= 0;
  // Signed out → open the login dialog (same as the navbar) instead of the buy modal.
  const gate = useAuthGate();

  // On-chain resolver — only active when chain is enabled, the user is authed, and
  // the caller provided chain metadata. Falls back to the play-money path otherwise.
  const useChainOpen =
    isChainSession() && !!chainTemplateId && !!chainPackType;
  const chainResolveDeck = useOpenPackOnChain({
    templateId: chainTemplateId ?? slug,
    packType: chainPackType ?? 'Standard',
  });

  const confirm = async () => {
    setProcessing(true);
    // Keep the settling beat even when the server answers instantly.
    const [result] = await Promise.all([purchase(slug), delay(PROCESSING_MS)]);
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
  };

  return (
    <>
      <div className={cn('flex items-center gap-2', actionsClassName)}>
        <Button
          variant={ctaVariant}
          size={ctaSize}
          className={ctaClassName}
          disabled={soldOut}
          onClick={gate(() => setConfirming(true))}
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

      <PackOpening
        open={opening}
        onClose={() => {
          setOpening(false);
          setHasPurchasedDeck(false);
        }}
        hideTrigger
        packName={packName}
        packSize={packSize}
        onComplete={complete}
        resolveDeck={useChainOpen ? chainResolveDeck : hasPurchasedDeck ? resolvePurchasedDeck : undefined}
      />
    </>
  );
}
