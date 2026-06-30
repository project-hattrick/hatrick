import Link from 'next/link';
import { Check } from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { lookup } from '@/lib/lookup';
import { toneConfig, toneFallback } from '@/config/tone.config';
import type { PlayMode } from '@/config/home.config';

/** Rich mode card: icon, optional live badge, feature list and CTA. */
function ModeFeatureCard({ mode }: { mode: PlayMode }) {
  const accent = lookup(toneConfig, mode.tone, toneFallback);
  const Icon = mode.icon;

  return (
    <GlassPanel tone="surface" className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <span className={cn('inline-flex size-11 items-center justify-center rounded-xl', accent.soft)}>
          <Icon className="size-5" />
        </span>
        {mode.badge ? (
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase', accent.soft)}>
            <span className={cn('size-1.5 animate-pulse rounded-full', accent.dot)} />
            {mode.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl font-bold">{mode.title}</h3>
        <p className="text-sm text-muted-foreground">{mode.description}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {mode.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-foreground/90">
            <Check className={cn('size-4 shrink-0', accent.text)} />
            {feature}
          </li>
        ))}
      </ul>

      <Link href={mode.href} className={buttonVariants({ className: 'mt-2 w-full' })}>
        {mode.cta}
      </Link>
    </GlassPanel>
  );
}

export { ModeFeatureCard };
