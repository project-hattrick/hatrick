import * as React from 'react';
import { cn } from '@/lib/utils';
import { lookup } from '@/lib/lookup';
import { PredictionMarket } from '@/enums/prediction-market.enum';

interface MarketIconProps extends React.ComponentProps<'svg'> {
  market: PredictionMarket;
}

const strokeProps = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// Geometric glyphs — unitless SVG geometry, colored by currentColor (the market accent).
const glyphs: Record<PredictionMarket, React.ReactNode> = {
  [PredictionMarket.Goal]: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5 8.4 10l1.4 4.2h4.4L15.6 10z" />
    </>
  ),
  [PredictionMarket.Shot]: (
    <>
      <circle cx="15.5" cy="12" r="5" />
      <path d="M2.5 8.5h4M1.5 12h4.5M2.5 15.5h4" />
    </>
  ),
  [PredictionMarket.Corner]: (
    <>
      <path d="M7 3.5v17" />
      <path d="M7 5l9 2.4L7 9.8z" fill="currentColor" stroke="none" />
      <path d="M7 20.5a6.5 6.5 0 0 1 6.5-6.5" />
    </>
  ),
  [PredictionMarket.YellowCard]: <rect x="8" y="3.5" width="8" height="17" rx="1.6" />,
  [PredictionMarket.RedCard]: <rect x="8" y="3.5" width="8" height="17" rx="1.6" />,
  [PredictionMarket.Event]: (
    <>
      <path d="M3.5 9.5h9l3.4 2.6a4.2 4.2 0 1 1-4.4-2.6" />
      <circle cx="11" cy="14" r="2.6" />
    </>
  ),
};

/** Geometric SVG icon kit. Inherits the market accent via currentColor. */
function MarketIcon({ market, className, ...props }: MarketIconProps) {
  const glyph = lookup(glyphs, market, glyphs[PredictionMarket.Event]);
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-5', className)} {...strokeProps} {...props}>
      {glyph}
    </svg>
  );
}

export { MarketIcon };
