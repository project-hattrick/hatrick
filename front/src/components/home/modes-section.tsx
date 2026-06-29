import { Section } from './section';
import { SectionHeading } from './section-heading';
import { ModeCard } from '@/components/common/mode-card';
import { modeCards } from '@/config/home.config';

/** "Two modes, one feed" — reuses the existing ModeCard. */
export function ModesSection() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Two modes, one feed"
        title="Pick how you play the cup"
        description="Fantasy and Live share one profile, one wallet and the same live TxLINE feed."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        {modeCards.map((mode) => (
          <ModeCard
            key={mode.title}
            title={mode.title}
            description={mode.description}
            href={mode.href}
            cta={mode.cta}
          />
        ))}
      </div>
    </Section>
  );
}
