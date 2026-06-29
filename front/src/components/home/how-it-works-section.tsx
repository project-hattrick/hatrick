import { Section } from './section';
import { SectionHeading } from './section-heading';
import { GlassPanel } from '@/components/common/glass-panel';
import { howItWorksSteps } from '@/config/home.config';

/** Three-step explainer. */
export function HowItWorksSection() {
  return (
    <Section surface>
      <SectionHeading eyebrow="How it works" title="From kickoff to payout" />
      <div className="grid gap-6 md:grid-cols-3">
        {howItWorksSteps.map((step) => (
          <GlassPanel key={step.step} tone="surface" className="flex flex-col gap-3 p-6">
            <span className="text-2xl font-bold text-neon">{step.step}</span>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </GlassPanel>
        ))}
      </div>
    </Section>
  );
}
