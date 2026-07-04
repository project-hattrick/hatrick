import { GlassPanel } from '@/components/common/glass-panel';
import type { HowItWorksStep } from '@/config/home.config';

/** Single "how it works" step: number, icon, title and blurb. */
function StepCard({ data }: { data: HowItWorksStep }) {
  const Icon = data.icon;

  return (
    <GlassPanel tone="surface" className="group flex h-full flex-col gap-4 p-5 md:p-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-surface-deep text-neon md:size-12">
          <Icon className="size-5 md:size-6" />
        </span>
        <span className="text-3xl font-black text-surface-3 transition-colors group-hover:text-neon/25 md:text-4xl">
          {data.step}
        </span>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <h3 className="text-base font-semibold text-foreground md:text-lg">{data.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
      </div>
    </GlassPanel>
  );
}

export { StepCard };
