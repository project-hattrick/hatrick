import { LegalDoc } from '@/components/legal/legal-doc';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Responsible Gaming',
  description: 'Our commitment to safe, fair, and responsible gaming on Hat-trick.',
  path: '/legal/responsible-gaming',
  noindex: true,
});

const sections = [
  {
    heading: '18+ only',
    body: 'Hat-trick is intended exclusively for users aged 18 and above. By accessing any prediction or betting surface you confirm that you meet the minimum age requirement in your jurisdiction. We reserve the right to request proof of age at any time.',
  },
  {
    heading: 'Play-money / devnet',
    body: 'This platform runs on Solana Devnet. All tokens, credits and winnings are fictitious play-money with zero real-world monetary value. Nothing on Hat-trick constitutes real-money gambling. No purchase is necessary to enjoy any feature.',
  },
  {
    heading: 'Self-exclusion',
    body: 'If you feel your engagement is becoming problematic, you can self-exclude from prediction and betting surfaces at any time via Settings in your account menu. Self-exclusion is effective immediately and lasts for a minimum of 24 hours. Reactivation requires a cooling-off confirmation.',
  },
  {
    heading: 'Deposit & stake limits',
    body: 'While this demo uses play-money only, we model responsible-gaming controls: daily and weekly stake limits are configurable from Settings in your account menu. Limits take effect instantly and can only be reduced — an increase requires a 24-hour review period.',
  },
  {
    heading: 'Help resources',
    body: 'If you or someone you know is struggling with gambling, free confidential support is available globally. Visit GamCare (gamcare.org.uk), Gamblers Anonymous (gamblersanonymous.org), or the National Council on Problem Gambling helpline at 1-800-522-4700. In an emergency, please contact your local emergency services.',
  },
];

export default function ResponsibleGamingPage() {
  return (
    <LegalDoc
      title="Responsible Gaming"
      updated="July 4, 2026"
      intro="Hat-trick is built with responsible gaming at its core. This page outlines the protections we have in place and the resources available if you need support. Final copy pending legal review."
      sections={sections}
    />
  );
}
