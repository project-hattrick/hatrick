import { LegalDoc } from '@/components/legal/legal-doc';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Cookie Policy',
  description: 'How Hat-trick uses cookies and browser storage, and how you can manage them.',
  path: '/legal/cookies',
  noindex: true,
});

const sections = [
  {
    heading: 'What are cookies?',
    body: 'Cookies are small text files placed on your device when you visit a website. Hat-trick uses a single browser cookie plus local storage, only to keep you signed in and remember your preferences — never to track you across the web or serve advertising.',
  },
  {
    heading: 'Essential cookies',
    body: 'We set one strictly-necessary cookie (ht_session) that holds your wallet authentication session. It is httpOnly (unreadable by page scripts), same-site, and expires with your session. It is required to stay logged in, so it is exempt from consent — you cannot opt out while using Hat-trick.',
  },
  {
    heading: 'Functional local storage',
    body: 'Your theme and language preferences, fantasy squad and bet-slip state, and onboarding progress are kept in your browser\'s local storage for fast reloads. This data stays on your device and is only sent to our servers when you explicitly sync your profile.',
  },
  {
    heading: 'No tracking or advertising',
    body: 'Hat-trick currently runs no third-party analytics, advertising, or cross-site tracking cookies. If we introduce optional analytics in the future, we will ask for your consent first and update this policy before any such cookie is set.',
  },
  {
    heading: 'Managing cookies',
    body: 'You can clear all cookies and local storage at any time from your browser settings. Clearing the session cookie will sign you out; clearing local storage resets your on-device preferences. Blocking the essential cookie may prevent the platform from functioning correctly.',
  },
  {
    heading: 'Updates to this policy',
    body: 'We may update this Cookie Policy from time to time. The "Last updated" date above reflects the most recent revision. Continued use of Hat-trick after a policy update constitutes acceptance of the revised policy.',
  },
];

export default function CookiesPage() {
  return (
    <LegalDoc
      title="Cookie Policy"
      updated="July 8, 2026"
      intro="This policy explains how Hat-trick uses cookies and browser storage, and how you can control them. Wireframe copy — final text pending legal review."
      sections={sections}
    />
  );
}
