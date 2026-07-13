export const legal = {
  common: {
    lastUpdated: 'Last updated: {date}',
    placeholder: 'Wireframe placeholder copy - replace with reviewed legal text before launch.',
    tabs: [
      { href: '/legal/privacy', label: 'Privacy' },
      { href: '/legal/terms', label: 'Terms' },
      { href: '/legal/responsible-gaming', label: 'Responsible Gaming' },
      { href: '/legal/cookies', label: 'Cookies' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'June 30, 2026',
    intro:
      'This wireframe describes how Hatrick (devnet demo) would handle your data. Not legal advice - final copy pending review.',
    sections: [
      { heading: 'Data we collect', body: 'Wallet address, display name and in-app activity (packs, squad, predictions and bets) needed to run the experience. We do not run third-party analytics or advertising trackers.' },
      { heading: 'Wallet & on-chain data', body: 'We read your public devnet wallet address to identify your profile. We never custody funds, and this demo moves only fictitious devnet tokens.' },
      { heading: 'How we use it', body: 'To power your profile, recompute fantasy attributes, settle predictions, and improve reliability. We do not sell personal data.' },
      { heading: 'Cookies & storage', body: 'One essential httpOnly cookie holds your login session; local storage holds UI preferences and squad/bet state. No tracking or advertising cookies - see the Cookie Policy for details.' },
      { heading: 'Your rights', body: 'You may request access to, correction of, or deletion of your profile data at any time via the contact below.' },
      { heading: 'Contact', body: 'Privacy questions: reach us through the Contact page. This is a devnet hackathon demo, not a production service.' },
    ],
  },
  terms: {
    title: 'Terms of Use',
    updated: 'June 30, 2026',
    intro:
      'These terms are MVP placeholder copy for the Hatrick devnet demo. Final terms require legal review before launch.',
    sections: [
      { heading: 'Eligibility', body: 'You must be 18+ to use betting surfaces. By using Hatrick you confirm you meet the age and jurisdiction requirements.' },
      { heading: 'Devnet & play-money', body: 'This is a demo on Solana devnet. All tokens are fictitious and have no monetary value. Nothing here is real-money gambling.' },
      { heading: 'Betting & geo-restrictions', body: 'Betting surfaces (live odds, bet slip, fixtures) are blocked in restricted jurisdictions such as Brazil (CMN Res. 5.298/2026), enforced by geolocation at the edge. Where blocked, the rest of the app - packs, fantasy, and the live match view - remains available.' },
      { heading: 'Fair play', body: 'Automation, exploits, or manipulation of feeds, packs, markets or matchmaking may result in suspension.' },
      { heading: 'Content & IP', body: 'Player and team names are shown as data only. Art direction is generic and not affiliated with or endorsed by FIFA or any league.' },
      { heading: 'Liability & changes', body: 'The service is provided "as is" for demonstration. We may update these terms; continued use means acceptance of the latest version.' },
    ],
  },
  responsibleGaming: {
    title: 'Responsible Gaming',
    description: 'Our commitment to safe, fair, and responsible gaming on Hatrick.',
    updated: 'June 30, 2026',
    intro:
      'Hatrick is a play-money devnet demo, but it still models responsible-gaming controls and clear user protections.',
    sections: [
      { heading: '18+ only', body: 'Hatrick is intended exclusively for users aged 18 and above. By accessing any prediction or betting surface you confirm that you meet the minimum age requirement in your jurisdiction. We reserve the right to request proof of age at any time.' },
      { heading: 'Play-money / devnet', body: 'This platform runs on Solana Devnet. All tokens, credits and winnings are fictitious play-money with zero real-world monetary value. Nothing on Hatrick constitutes real-money gambling. No purchase is necessary to enjoy any feature.' },
      { heading: 'Self-exclusion', body: 'If you feel your engagement is becoming problematic, you can self-exclude from prediction and betting surfaces at any time via Settings in your account menu. Self-exclusion is effective immediately and lasts for a minimum of 24 hours. Reactivation requires a cooling-off confirmation.' },
      { heading: 'Deposit & stake limits', body: 'While this demo uses play-money only, we model responsible-gaming controls: daily and weekly stake limits are configurable from Settings in your account menu. Limits take effect instantly and can only be reduced - an increase requires a 24-hour review period.' },
      { heading: 'Help resources', body: 'If you or someone you know is struggling with gambling, free confidential support is available globally. Visit GamCare (gamcare.org.uk), Gamblers Anonymous (gamblersanonymous.org), or the National Council on Problem Gambling helpline at 1-800-522-4700. In an emergency, please contact your local emergency services.' },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    description: 'How Hatrick uses cookies and browser storage, and how you can manage them.',
    updated: 'June 30, 2026',
    intro:
      'This page explains the minimal storage Hatrick uses to keep the devnet demo functional.',
    sections: [
      { heading: 'What are cookies?', body: 'Cookies are small text files placed on your device when you visit a website. Hatrick uses a single browser cookie plus local storage, only to keep you signed in and remember your preferences - never to track you across the web or serve advertising.' },
      { heading: 'Essential cookies', body: 'We set one strictly-necessary cookie (ht_session) that holds your wallet authentication session. It is httpOnly, same-site, and expires with your session. It is required to stay logged in, so it is exempt from consent.' },
      { heading: 'Functional local storage', body: "Your theme and language preferences, fantasy squad and bet-slip state, and onboarding progress are kept in your browser's local storage for fast reloads. This data stays on your device and is only sent to our servers when you explicitly sync your profile." },
      { heading: 'No tracking or advertising', body: 'Hatrick currently runs no third-party analytics, advertising, or cross-site tracking cookies. If we introduce optional analytics in the future, we will ask for your consent first and update this policy before any such cookie is set.' },
      { heading: 'Managing cookies', body: 'You can clear all cookies and local storage at any time from your browser settings. Clearing the session cookie will sign you out; clearing local storage resets your on-device preferences. Blocking the essential cookie may prevent the platform from functioning correctly.' },
      { heading: 'Updates to this policy', body: 'We may update this Cookie Policy from time to time. The "Last updated" date above reflects the most recent revision. Continued use of Hatrick after a policy update constitutes acceptance of the revised policy.' },
    ],
  },
  geoRestricted: {
    title: 'Not available in your region',
    description: 'Betting surfaces are restricted in your jurisdiction.',
    updated: 'June 30, 2026',
    intro:
      'Hatrick keeps fantasy and match-viewing features available where possible, while blocking betting surfaces in restricted regions.',
    sections: [
      { heading: 'Why you are seeing this', body: 'Sports-event derivatives and betting surfaces are restricted in some jurisdictions (for example, Brazil under CMN Resolution 5.298/2026). Based on your region, live odds, the bet slip, and fixtures are unavailable to you.' },
      { heading: 'What you can still do', body: 'The rest of Hatrick remains open: open packs, build your fantasy XI, follow the 2D live match view, and explore the store. Only the betting surfaces are blocked.' },
      { heading: 'Play-money / devnet', body: 'Hatrick runs on Solana Devnet with fictitious play-money that has no real-world value. This geo-restriction models the compliance controls a production sportsbook would apply.' },
    ],
  },
} as const;
