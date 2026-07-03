import { GlassPanel } from '@/components/common/glass-panel';
import type { HowItWorksStep } from '@/config/home.config';

/** Single "how it works" step: number, icon, title and blurb. */
function StepCard({ data }: { data: HowItWorksStep }) {
  const Icon = data.icon;

  return (
    <GlassPanel tone="surface" className="flex h-full flex-col gap-3 p-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-surface-deep text-neon">
          <Icon className="size-5" />
        </span>
        <span className="text-3xl font-black text-surface-3">{data.step}</span>
      </div>
      <h3 className="text-base font-semibold">{data.title}</h3>
      <p className="text-sm text-muted-foreground">{data.description}</p>
    </GlassPanel>
  );
}

export { StepCard };
