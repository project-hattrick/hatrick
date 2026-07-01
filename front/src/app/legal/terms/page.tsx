import { LegalDoc } from '@/components/legal/legal-doc';

const sections = [
  { heading: 'Eligibility', body: 'You must be 18+ to use betting surfaces. By using Hat-trick you confirm you meet the age and jurisdiction requirements.' },
  { heading: 'Devnet & play-money', body: 'This is a demo on Solana devnet. All tokens are fictitious and have no monetary value. Nothing here is real-money gambling.' },
  { heading: 'Betting & geo-restrictions', body: 'Betting surfaces are blocked in restricted jurisdictions. Where blocked, free-to-play predictions remain available.' },
  { heading: 'Fair play', body: 'Automation, exploits, or manipulation of feeds, packs, markets or matchmaking may result in suspension.' },
  { heading: 'Content & IP', body: 'Player and team names are shown as data only. Art direction is generic and not affiliated with or endorsed by FIFA or any league.' },
  { heading: 'Liability & changes', body: 'The service is provided “as is” for demonstration. We may update these terms; continued use means acceptance of the latest version.' },
];

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      updated="June 30, 2026"
      intro="This wireframe outlines the rules for using the Hat-trick devnet demo. Final terms pending legal review."
      sections={sections}
    />
  );
}
