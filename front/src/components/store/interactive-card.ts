/**
 * Shared "this card reacts to you" treatment — lift, neon border and a soft neon
 * glow on hover. Layered on top of a GlassPanel so every store tile speaks the
 * same interactive language. Pair with `group` on the same element to drive
 * child reveals (hover-revealed actions, sprite scale, etc.).
 */
export const INTERACTIVE_CARD =
  'group transition-[transform,border-color,box-shadow] duration-200 ease-out ' +
  'hover:-translate-y-1 hover:border-neon/40 hover:shadow-[0_0_44px_-10px_rgba(174,240,25,0.22)] ' +
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0';

/**
 * Secondary action that slides in when the parent `group` card is hovered/focused.
 * Falls back to always-visible on touch devices (no hover) so the CTA never hides
 * where there's no pointer to reveal it.
 */
export const REVEAL_ON_HOVER =
  'opacity-0 translate-y-1 transition-all duration-200 ' +
  'group-hover:opacity-100 group-hover:translate-y-0 ' +
  'group-focus-within:opacity-100 group-focus-within:translate-y-0 ' +
  '[@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0';
