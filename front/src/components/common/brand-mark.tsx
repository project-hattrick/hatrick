interface BrandMarkProps {
  className?: string;
}

/** Abstract sporty wordmark glyph (currentColor — set text-neon on a parent). */
function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Hat-trick"
    >
      <path d="M30 75 L45 25 L75 25 L60 75 Z" fill="currentColor" />
      <path d="M25 75 L40 25 L45 25 L30 75 Z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export { BrandMark };
