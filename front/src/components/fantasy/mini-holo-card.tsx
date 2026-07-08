import Image from 'next/image';
import { talero } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { Flag } from '@/components/common/flag';
import type { PlayerCardData } from '@/config/fantasy-cards.config';

/**
 * Minimalist collectible card following the holographic card identity:
 * dark texture base, Talero rating, country flag, holo tint (flag colors) on hover.
 * Pure CSS — cheap enough for long strips, unlike the full HoloPlayerCard.
 */
export function MiniHoloCard({ card, className }: { card: PlayerCardData; className?: string }) {
  const [holo1, holo2, holo3] = card.holoColors;

  return (
    <div
      className={cn(
        'group relative aspect-[5/7] w-[96px] shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-e2 transition-transform duration-200 hover:-translate-y-1',
        className,
      )}
      style={{
        backgroundColor: '#101013',
        backgroundImage: "url('/cards/card-texture.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Image src={card.portraitSrc} alt={card.name} fill sizes="96px" className="object-contain object-bottom opacity-95" />

      {/* Holo tint in the country colors, hover only */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-35"
        style={{
          background: `linear-gradient(120deg, ${holo1} 0%, ${holo2} 50%, ${holo3} 100%)`,
          mixBlendMode: 'color-dodge',
        }}
      />

      <div className="absolute top-1.5 left-2 flex flex-col gap-0.5 leading-none">
        <span className={cn(talero.className, 'text-lg text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.7)]')}>
          {card.rating}
        </span>
        <Flag code={card.code} className="text-micro" />
      </div>

      {/* Name plate over the portrait */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-1.5 pt-4 pb-1.5 text-center">
        <p className="truncate text-[9px] font-bold tracking-wide text-white uppercase">{card.name}</p>
        <p className="text-[8px] text-white/50">{card.position}</p>
      </div>
    </div>
  );
}
