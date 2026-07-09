import { LegalDoc } from '@/components/legal/legal-doc';

const sections = [
  { heading: 'Data we collect', body: 'Wallet address, display name and in-app activity (packs, squad, predictions and bets) needed to run the experience. We do not run third-party analytics or advertising trackers.' },
  { heading: 'Wallet & on-chain data', body: 'We read your public devnet wallet address to identify your profile. We never custody funds, and this demo moves only fictitious devnet tokens.' },
  { heading: 'How we use it', body: 'To power your profile, recompute fantasy attributes, settle predictions, and improve reliability. We do not sell personal data.' },
  { heading: 'Cookies & storage', body: 'One essential httpOnly cookie holds your login session; local storage holds UI preferences and squad/bet state. No tracking or advertising cookies — see the Cookie Policy for details.' },
  { heading: 'Your rights', body: 'You may request access to, correction of, or deletion of your profile data at any time via the contact below.' },
  { heading: 'Contact', body: 'Privacy questions: privacy@hat-trick.demo (placeholder).' },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated="June 30, 2026"
      intro="This wireframe describes how Hat-trick (devnet demo) would handle your data. Not legal advice — final copy pending review."
      sections={sections}
    />
  );
}
