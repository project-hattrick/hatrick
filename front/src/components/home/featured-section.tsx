import { Section } from './section';
import { SectionHeading } from './section-heading';
import { PlaceholderCard } from './placeholder-card';
import { featuredMatches } from '@/config/home.config';

/** Grid of placeholder match cards. */
export function FeaturedSection() {
  return (
    <Section>
      <SectionHeading eyebrow="Featured" title="Matches to watch" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {featuredMatches.map((match) => (
          <PlaceholderCard key={match.id} title={`${match.home} vs ${match.away}`} subtitle={match.kickoff} />
        ))}
      </div>
    </Section>
  );
}
