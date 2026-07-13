export const home = {
  srTitle: 'Hatrick - Live & Fantasy football for the World Cup',
  site: {
    title: 'Hatrick - Live & Fantasy football, one platform',
    description:
      'One platform, two ways to live the World Cup: predict and bet on real matches in Live Mode, or build your XI and duel friends 1v1 in Fantasy - powered by the TxLINE real-time feed.',
  },
  footer: {
    tagline: 'The platform that puts you at the heart of the game - live, fantasy and predictions in one place.',
    getApp: 'Get the app',
    copyright: '© 2026 Hatrick. All rights reserved.',
    disclaimer: 'Devnet demo · play-money only · not affiliated with FIFA.',
    socials: {
      website: 'Website',
      community: 'Community',
      telegram: 'Telegram',
      email: 'Email',
    },
    badges: {
      appStore: { store: 'App Store', tagline: 'Download on the' },
      googlePlay: { store: 'Google Play', tagline: 'Get it on' },
    },
    columns: [
      {
        title: 'Navigation',
        links: [
          { label: 'Home', href: '/' },
          { label: 'Live Mode', href: '/live' },
          { label: 'Fantasy', href: '/fantasy' },
          { label: 'Duelists', href: '/duelists' },
        ],
      },
      {
        title: 'Explore',
        links: [
          { label: 'Store', href: '/store' },
          { label: 'Blog', href: '/blog' },
          { label: 'FAQ', href: '/faq' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Terms of Use', href: '/legal/terms' },
          { label: 'Privacy Policy', href: '/legal/privacy' },
          { label: 'Responsible Gaming', href: '/legal/responsible-gaming' },
          { label: 'Cookie Policy', href: '/legal/cookies' },
        ],
      },
    ],
  },
  dashboard: {
    squadTitle: 'Your fantasy squad',
    modesTitle: 'Two modes. Endless ways to win.',
    greeting: 'Good to see you again',
    matchLoading: 'Loading match...',
    matchSearch: 'Search matches or teams...',
  },
} as const;
