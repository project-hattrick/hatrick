export const about = {
  metadata: {
    title: 'About',
    description:
      'Hatrick is a dual-mode World Cup platform: predict live matches in real time or build your XI and duel friends 1v1, all powered by the TxLINE feed.',
  },
  hero: {
    eyebrow: 'Hatrick',
    title: 'One platform, two ways to live the World Cup',
  },
  sections: {
    chooseMode: 'Choose your mode',
    poweredBy: 'Powered by',
    txlineTitle: 'TxLINE - the real-time feed',
    values: 'Our values',
    ready: 'Ready to play?',
    readyBody: 'Connect your Solana wallet and step into the World Cup.',
  },
  modes: [
    {
      label: 'Live Mode',
      title: 'Real matches, real stakes',
      body: 'Follow every World Cup match as it happens. The TxLINE feed delivers goals, cards and substitutions in milliseconds. Place predictions on live markets and watch your balance react to the action on the pitch.',
      cta: 'Go to Live',
    },
    {
      label: 'Fantasy Mode',
      title: 'Your XI, your rules',
      body: 'Assemble a squad of real World Cup players whose attribute scores update after every confirmed match event. Then pick a rival from the Duelists directory and send a 1v1 challenge - the 2D arena settles the score.',
      cta: 'Build your squad',
    },
  ],
  txline:
    "Every event you see on Hatrick originates from TxLINE, a secured Server-Sent Events stream that delivers confirmed match data within milliseconds of the whistle. Goals settle your bets. Assists bump your player's rating. Red cards change the match simulation. TxLINE is the single source of truth that keeps Live and Fantasy in lockstep with reality.",
  tags: ['Match events', 'Player stats', 'Market settlement', 'Attribute recalculation'],
  values: [
    {
      title: 'Real-time everything',
      body: 'Every goal, card, and substitution from the TxLINE feed flows into Live odds and Fantasy attribute updates within milliseconds.',
    },
    {
      title: 'Competitive by design',
      body: 'From ranked 1v1 duels to live-market predictions, Hatrick is built for players who want to test their football knowledge against real opponents.',
    },
    {
      title: 'Global stage',
      body: '32 teams, 64 matches, one platform. Every World Cup fixture is a new opportunity - in Live, Fantasy, or both.',
    },
    {
      title: 'Transparent & fair',
      body: 'Settlements happen on Solana Devnet and are verifiable on-chain. Play-money only - no real funds, no hidden mechanics.',
    },
    {
      title: 'Data-driven attributes',
      body: 'Player ratings are not guesses. They reflect real performance metrics: goals, assists, key passes, tackles, saves - recalculated match by match.',
    },
    {
      title: 'Social at the core',
      body: 'Add friends, challenge rivals, and track head-to-head records. The Duelists directory puts the entire Hatrick community a search away.',
    },
  ],
} as const;
