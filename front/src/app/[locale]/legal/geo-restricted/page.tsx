import { LegalDoc } from '@/components/legal/legal-doc';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Not available in your region',
  description: 'Betting surfaces are restricted in your jurisdiction.',
  path: '/legal/geo-restricted',
  noindex: true,
});

const sections = [
  {
    heading: 'Why you are seeing this',
    body: 'Sports-event derivatives and betting surfaces are restricted in some jurisdictions (for example, Brazil under CMN Resolution 5.298/2026). Based on your region, live odds, the bet slip, and fixtures are unavailable to you.',
  },
  {
    heading: 'What you can still do',
    body: 'The rest of Hat-trick remains open: open packs, build your fantasy XI, follow the 2D live match view, and explore the store. Only the betting surfaces are blocked.',
  },
  {
    heading: 'Play-money / devnet',
    body: 'Hat-trick runs on Solana Devnet with fictitious play-money that has no real-world value. This geo-restriction models the compliance controls a production sportsbook would apply.',
  },
];

export default function GeoRestrictedPage() {
  return (
    <LegalDoc
      title="Not available in your region"
      updated="July 11, 2026"
      intro="Betting surfaces are restricted in your jurisdiction. This is a compliance measure for sports-event derivatives — the rest of the app is still available to you."
      sections={sections}
    />
  );
}
