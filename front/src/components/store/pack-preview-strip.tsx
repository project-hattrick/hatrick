import Image from 'next/image';
import { PACK_POOL, packPreview } from '@/config/pack-pool.config';

/** Overlapping face chips previewing who can drop from a pack, plus a "+N more" tail. */
export function PackPreviewStrip({ slug }: { slug: string }) {
  const cards = packPreview(slug).filter((card) => card.portraitSrc);
  const more = PACK_POOL.length - cards.length;
  if (cards.length === 0) return null;

  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="flex">
        {cards.map((card, i) => (
          <Image
            key={card.name}
            src={card.portraitSrc!}
            alt={card.name}
            title={card.name}
            width={28}
            height={28}
            className={`size-7 rounded-full border border-overlay/80 bg-surface-1 object-cover object-top ${i > 0 ? '-ml-2' : ''}`}
          />
        ))}
      </div>
      {more > 0 && <span className="text-micro text-muted-foreground">+{more} more</span>}
    </div>
  );
}
