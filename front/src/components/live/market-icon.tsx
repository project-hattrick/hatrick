import * as React from 'react';
import { cn } from '@/lib/utils';
import { lookup } from '@/lib/lookup';
import { marketTypeConfig, marketTypeFallback } from '@/config/market-type.config';
import { MarketType } from '@/enums/market-type.enum';

interface MarketIconProps extends React.ComponentProps<'svg'> {
  market: MarketType;
}

/** Market icon (lucide, config-driven). Inherits the market accent via currentColor. */
function MarketIcon({ market, className, ...props }: MarketIconProps) {
  const Icon = lookup(marketTypeConfig, market, marketTypeFallback).icon;
  return <Icon aria-hidden className={cn('size-5', className)} {...props} />;
}

export { MarketIcon };
