'use client';

import Image from 'next/image';
import { MetalFx } from 'metal-fx';
import { GlassPanel } from '@/components/common/glass-panel';
import { BuyPackFlow } from '@/components/store/buy-pack-flow';
import { INTERACTIVE_CARD } from '@/components/store/interactive-card';
import { PackPreviewStrip } from '@/components/store/pack-preview-strip';
import { StoreBadge, BadgeTone } from '@/components/store/store-badge';
import { useItemStock } from '@/services/queries/use-store-item';
import { cn } from '@/lib/utils';

export interface StorePack {
  /** Store catalog slug — drives stock and the purchase call. */
  slug: string;
  name: string;
  /** Cards drawn per opening. */
  players: number;
  price: string;
  /** Uppercase kicker above the title (e.g. "Top pick"). */
  label: string;
  caption: string;
  /** Featured tile — wrapped in the chromatic metal ring (same as the bet YES button). */
  highlight?: boolean;
}

/** Coin icon + price, the shared buy-button content. */
function CoinPrice({ price }: { price: string }) {
  return (
    <>
      <Image src="/coin.png" alt="" width={16} height={16} className="size-4" />
      {price}
    </>
  );
}

/** A buyable pack tile: foil thumb, kicker/title/caption, live stock and the confirm-modal buy flow. */
export function StorePackTile({ pack }: { pack: StorePack }) {
  const stock = useItemStock(pack.slug);
  const soldOut = stock !== undefined && stock <= 0;

  const tile = (
    <GlassPanel
      radius="xl"
      tone="dark"
      className={cn(
        'flex h-full w-full min-w-0 items-center gap-4 p-5',
        // Framed tile: the WRAPPER lifts on hover (panel + ring move together) — a lift here
        // would slide the panel out of the metal frame. `group` stays for the thumb scale.
        pack.highlight ? 'group rounded-[13px] border-transparent' : INTERACTIVE_CARD,
        soldOut && 'opacity-55',
      )}
    >
      <Image
        src="/cards/pack-foil.png"
        alt=""
        width={660}
        height={1122}
        className="h-24 w-auto shrink-0 drop-shadow-[0_14px_24px_rgba(0,0,0,0.65)] transition-transform duration-200 group-hover:scale-[1.05]"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('text-eyebrow', pack.highlight ? 'text-neon' : 'text-muted-foreground')}>{pack.label}</span>
          {stock !== undefined && (
            <StoreBadge tone={soldOut ? BadgeTone.Info : BadgeTone.Value}>
              {soldOut ? 'Sold out' : `${stock} left`}
            </StoreBadge>
          )}
        </div>
        <h3 className="text-lead leading-tight font-black uppercase">{pack.name}</h3>
        <p className="text-caption text-muted-foreground">{pack.caption}</p>
        <PackPreviewStrip slug={pack.slug} />
        <BuyPackFlow
          slug={pack.slug}
          packName={pack.name}
          packSize={pack.players}
          price={pack.price}
          tagline={pack.caption}
          ctaVariant={pack.highlight ? 'default' : 'secondary'}
          ctaSize="sm"
          ctaClassName="font-semibold"
          cta={<CoinPrice price={`Buy · ${pack.price}`} />}
          showOdds
          oddsReveal
          actionsClassName="mt-2.5"
        />
      </div>
    </GlassPanel>
  );

  if (!pack.highlight) return tile;

  // Featured pack wears the chromatic liquid-metal ring (same treatment as the bet YES button).
  // The wrapper's padding equals ringCssPx so the ring lives in it as a frame — an opaque
  // child covering the wrapper edge would otherwise hide/cut the metal.
  return (
    <MetalFx
      preset="chromatic"
      theme="dark"
      strength={0.9}
      ringCssPx={3}
      borderRadius={16}
      normalizeHostStyles={false}
      className="flex h-full w-full min-w-0 flex-col items-stretch overflow-visible! rounded-2xl p-[3px] transition-transform duration-200 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {tile}
    </MetalFx>
  );
}
