import { cn } from '@/lib/utils';

/** Same stage as the pack-opening podium — purchase modals present the item on it. */
const STAGE_BG = "url('/cards/stadium-podium.png')";

/**
 * Staged frame for purchase modals: the item floats over the pack-opening stage,
 * seated by a soft glow. `glowColor` follows the item (neon default, rarity tint
 * for player cards).
 */
export function ItemShowcase({
  glowColor = 'rgba(174,240,25,0.2)',
  className,
  children,
}: {
  glowColor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative flex w-full flex-col items-center overflow-hidden rounded-2xl border border-border/60 bg-cover bg-center px-4 py-6',
        className,
      )}
      style={{ backgroundImage: STAGE_BG }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-overlay/70" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-overlay/85 via-transparent to-overlay/55" />
      {/* Glow seating the item on the stage. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: `radial-gradient(55% 60% at 50% 85%, ${glowColor}, transparent 70%)` }}
      />
      <div className="relative z-10 flex w-full flex-col items-center gap-3">{children}</div>
    </div>
  );
}
