import { sairaCondensed } from '@/lib/fonts';
import { cn } from '@/lib/utils';

/**
 * Compact directory banner in the store-hero language: gradient DUELISTS
 * wordmark over the ambient neon glow — no arena photo, this is a directory.
 */
export function DuelistsHero() {
  return (
    <section className="relative overflow-hidden py-10 text-center sm:py-14">
      <p className="text-eyebrow text-neon">Ranked ladder</p>

      {/* The slant is a skew TRANSFORM, not font-style italic: a synthesized oblique
          shears glyphs outside the bg-clip-text box and leaves transparent corners. */}
      <h1
        className={cn(
          sairaCondensed.className,
          'relative mt-2 inline-block -skew-x-12 text-[clamp(56px,9vw,120px)] leading-none tracking-tight uppercase',
        )}
      >
        {/* Static neon halo seating the wordmark (exempt neon-glow treatment). */}
        <span aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-2/3 rounded-full bg-neon/20 blur-3xl" />
        {/* py keeps the clipped gradient covering the full glyphs — anything outside
            the background box turns transparent with bg-clip-text. */}
        <span className="block bg-gradient-to-b from-neon-hover via-neon to-[color-mix(in_oklch,var(--color-neon)_55%,black)] bg-clip-text px-[0.08em] py-[0.08em] text-transparent">
          Duelists
        </span>
      </h1>

      <p className="mt-3 text-lead text-muted-foreground">
        Scout the ladder. Add friends. Challenge anyone to a 1v1.
      </p>
    </section>
  );
}
