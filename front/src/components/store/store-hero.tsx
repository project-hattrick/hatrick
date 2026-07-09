import { sairaCondensed } from '@/lib/fonts';
import { cn } from '@/lib/utils';

/** Arena backdrop for the store hero — same stage family as the pack-opening podium. */
const ARENA_BG = "url('/cards/arena-stage.png')";

/**
 * Delimited arena banner: the stadium photo anchored to its floor, fading in from
 * the page background at the top and back into it at the bottom, with the big
 * TEAM STORE gradient wordmark floating over the stage.
 */
export function StoreHero() {
  return (
    <section className="relative h-[clamp(560px,66vh,720px)] overflow-hidden">
      {/* Stage photo — floor at the bottom so following sections sit "on the ground". */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-bottom"
        style={{ backgroundImage: ARENA_BG }}
      />
      {/* Blend layers: emerge from the page bg at the top, sink back into it below. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[32%] bg-gradient-to-b from-background via-background/35 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-background via-background/55 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[12%] bg-gradient-to-r from-background to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[12%] bg-gradient-to-l from-background to-transparent" />

      {/* Wordmark */}
      {/* pb clears the overlapping section pulled up over the hero floor (-mt on the page). */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-10 pb-24 text-center">
        {/* Dark scrim behind the wordmark — keeps it readable over the bright stage smoke. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-[80%] -translate-y-1/2 bg-[radial-gradient(50%_55%_at_50%_50%,rgba(0,0,0,0.6),transparent_75%)]" />
        {/* Each line keeps py so the clipped gradient covers the full glyphs (anything outside
            the background box turns transparent with bg-clip-text); negative margin re-tightens. */}
        {/* The slant is a skew TRANSFORM on the h1, not font-style italic: transforms run after
            paint, so the clipped-gradient text tilts as pixels and nothing can get cut — while a
            synthesized oblique shears glyphs outside the bg-clip-text box (transparent corners). */}
        <h1
          className={cn(
            sairaCondensed.className,
            'relative flex -skew-x-12 flex-col items-center text-[clamp(76px,13vw,190px)] leading-none tracking-tight uppercase',
          )}
        >
          <span className="block bg-gradient-to-b from-white via-white to-muted-foreground bg-clip-text px-[0.08em] py-[0.08em] text-transparent">
            Team
          </span>
          <span className="relative -mt-[0.34em] block">
            {/* Static neon halo seating the STORE line (exempt neon-glow treatment). */}
            <span aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-2/3 rounded-full bg-neon/20 blur-3xl" />
            <span className="block bg-gradient-to-b from-neon-hover via-neon to-[color-mix(in_oklch,var(--color-neon)_55%,black)] bg-clip-text px-[0.08em] py-[0.08em] text-transparent">
              Store
            </span>
          </span>
        </h1>
        <p className="mt-4 text-lead text-muted-foreground">Build your squad. Dominate the pitch.</p>
      </div>
    </section>
  );
}
