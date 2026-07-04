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
    body: 'Cookies are small text files placed on your device when you visit a website. Hat-trick uses browser cookies and local storage to remember your preferences, keep you logged in via your wallet session, and understand how the platform is used — so we can improve it.',
  },
  {
    heading: 'Essential cookies',
    body: 'These are required for the platform to function. They manage your wallet authentication session, theme and language preferences, and your squad / bet-slip state between page reloads. You cannot opt out of essential cookies while using Hat-trick.',
  },
  {
    heading: 'Analytics cookies',
    body: 'We use aggregate, anonymised analytics to understand which features are popular and where errors occur. Analytics data is never tied to your identity or wallet address and is not sold or shared with third parties. Analytics are disabled during self-exclusion.',
  },
  {
    heading: 'Performance & local storage',
    body: 'Match state, fantasy squad data and UI preferences are stored in browser local storage for fast, offline-capable access. This data stays on your device; it is not sent to our servers unless you explicitly sync your profile.',
  },
  {
    heading: 'Managing cookies',
    body: 'You can clear all cookies and local storage at any time from your browser settings. Clearing session storage will sign you out. You can also disable analytics from the Privacy toggle in your Profile settings. Blocking essential cookies may prevent the platform from functioning correctly.',
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
      updated="July 4, 2026"
      intro="This policy explains how Hat-trick uses cookies and browser storage, and how you can control them. Wireframe copy — final text pending legal review."
      sections={sections}
    />
  );
}
