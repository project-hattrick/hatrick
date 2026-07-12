import { sairaCondensed } from '@/lib/fonts';
import { cn } from '@/lib/utils';

interface DuelistsHeroProps {
  eyebrow: string;
  title: string;
  intro: string;
}

/** Compact directory banner in the store-hero language. */
export function DuelistsHero({ eyebrow, title, intro }: DuelistsHeroProps) {
  return (
    <section className="relative overflow-hidden py-10 text-center sm:py-14">
      <p className="text-eyebrow text-neon">{eyebrow}</p>

      <h1
        className={cn(
          sairaCondensed.className,
          'relative mt-2 inline-block -skew-x-12 text-[clamp(56px,9vw,120px)] leading-none tracking-tight uppercase',
        )}
      >
        <span aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-2/3 rounded-full bg-neon/20 blur-3xl" />
        <span className="block bg-gradient-to-b from-neon-hover via-neon to-[color-mix(in_oklch,var(--color-neon)_55%,black)] bg-clip-text px-[0.08em] py-[0.08em] text-transparent">
          {title}
        </span>
      </h1>

      <p className="mt-3 text-lead text-muted-foreground">{intro}</p>
    </section>
  );
}
