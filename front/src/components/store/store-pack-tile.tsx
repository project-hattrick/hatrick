'use client';

import Image from 'next/image';
import { MetalFx } from 'metal-fx';
import { GlassPanel } from '@/components/common/glass-panel';
import { BuyPackFlow } from '@/components/store/buy-pack-flow';
import { INTERACTIVE_CARD } from '@/components/store/interactive-card';
import { cn } from '@/lib/utils';

export interface StorePack {
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

/** A buyable pack tile: foil thumb, kicker/title/caption and the confirm-modal buy flow. */
export function StorePackTile({ pack }: { pack: StorePack }) {
  const tile = (
    <GlassPanel
      radius="xl"
      tone="dark"
      className={cn('flex h-full items-center gap-4 p-5', INTERACTIVE_CARD, pack.highlight && 'border-transparent')}
    >
      <Image
        src="/cards/pack-foil.png"
        alt=""
        width={660}
        height={1122}
        className="h-24 w-auto shrink-0 drop-shadow-[0_14px_24px_rgba(0,0,0,0.65)] transition-transform duration-200 group-hover:scale-[1.05]"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cn('text-eyebrow', pack.highlight ? 'text-neon' : 'text-muted-foreground')}>{pack.label}</span>
        <h3 className="text-lead leading-tight font-black uppercase">{pack.name}</h3>
        <p className="text-caption text-muted-foreground">{pack.caption}</p>
        <BuyPackFlow
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
  return (
    <MetalFx preset="chromatic" strength={0.9} ringCssPx={3} borderRadius={16} normalizeHostStyles={false} className="flex h-full flex-col rounded-2xl">
      {tile}
    </MetalFx>
  );
}
