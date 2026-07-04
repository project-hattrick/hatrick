import { FaqCategory } from '@/enums/faq-category.enum';

export interface FaqItem {
  q: string;
  a: string;
  category: FaqCategory;
}

export const faqItems: FaqItem[] = [
  {
    q: 'What is Hat-trick?',
    a: 'Hat-trick is a dual-mode World Cup platform powered by the TxLINE real-time feed. Live Mode lets you predict and place play-money bets on real matches as they happen. Fantasy Mode lets you build a squad and challenge friends to simulated 1v1 arena duels. Both modes share one profile and wallet.',
    category: FaqCategory.General,
  },
  {
    q: 'Is Hat-trick free to use?',
    a: 'Yes. Hat-trick runs on Solana Devnet with play-money tokens that carry zero real-world value. Every feature is accessible without spending anything.',
    category: FaqCategory.General,
  },
  {
    q: 'Is this real-money gambling?',
    a: 'No. This is a hackathon demo on Solana Devnet. All tokens are fictitious play-money. Nothing on Hat-trick constitutes real-money gambling, and no purchase is required.',
    category: FaqCategory.General,
  },
  {
    q: 'What is Live Mode?',
    a: 'Live Mode streams World Cup matches in real time via TxLINE. You watch match events unfold in the 2D live view and place predictions on outcomes, goal scorers, and live markets. Markets open and settle automatically as TxLINE confirms events.',
    category: FaqCategory.Live,
  },
  {
    q: 'What markets are available?',
    a: 'Markets include match result (1X2), over/under goals, next goal scorer, both teams to score, and corner/card specials. Market availability depends on the TxLINE feed for each match.',
    category: FaqCategory.Live,
  },
  {
    q: 'How are bets settled?',
    a: 'Settlement is fully automatic. When TxLINE sends a confirmed event (goal, final whistle, etc.) our backend resolves all open markets and credits or debits your play-money balance instantly.',
    category: FaqCategory.Live,
  },
  {
    q: 'What is Fantasy Mode?',
    a: 'Fantasy Mode lets you assemble a squad of real World Cup players whose attributes are recalculated from live performance data. You then challenge a friend to a 1v1 duel where both squads face off in the 2D game engine.',
    category: FaqCategory.Fantasy,
  },
  {
    q: 'How do 1v1 friend duels work?',
    a: 'Find an opponent in the Duelists directory, send a challenge, and once they accept both squads enter the arena. The 2D engine simulates the match using real player attribute scores. Results are instant and update your rating.',
    category: FaqCategory.Fantasy,
  },
  {
    q: 'How are player ratings calculated?',
    a: 'Ratings derive from real World Cup performance metrics ingested via TxLINE: goals, assists, key passes, tackles, saves and more. Ratings update after each confirmed match event — so a hat-trick in real life meaningfully boosts your card.',
    category: FaqCategory.Fantasy,
  },
  {
    q: 'How do I connect my wallet?',
    a: 'Click the wallet button in the top-right corner. Hat-trick supports Phantom and any Solana-compatible wallet adapter. Make sure your wallet is set to Solana Devnet — Mainnet connections are blocked to prevent accidental real-fund exposure.',
    category: FaqCategory.Account,
  },
  {
    q: 'How do I add friends and send challenges?',
    a: 'Go to the Duelists directory, find a player, and click Add Friend or Challenge. Friend requests persist in your browser (via local storage) until the backend social layer ships in a future release.',
    category: FaqCategory.Account,
  },
  {
    q: 'How do I report a bug or give feedback?',
    a: 'Use the Contact page to send a message, or join our community channel. We appreciate all feedback during the hackathon demo period.',
    category: FaqCategory.Account,
  },
  {
    q: 'What is the TxLINE feed?',
    a: 'TxLINE is our real-time data provider. It delivers match events, player statistics and market settlements via a secured Server-Sent Events stream. Every goal, card, substitution, and final whistle flows from TxLINE into the platform within milliseconds.',
    category: FaqCategory.Technical,
  },
  {
    q: 'Why do I see "devnet demo" labels?',
    a: 'Hat-trick was built for the TxODDS World Cup Hackathon 2026 and runs entirely on Solana Devnet. All tokens are fictitious, no real money is involved, and the service is provided as a demonstration only.',
    category: FaqCategory.Technical,
  },
  {
    q: 'What browsers are supported?',
    a: 'Any modern browser — Chrome, Firefox, Edge, or Safari. WebGL is required for the 2D game engine. Mobile browsers are supported but desktop gives the best arena experience.',
    category: FaqCategory.Technical,
  },
];

/** Ordered list of categories for rendering grouped FAQ sections. */
export const FAQ_CATEGORY_ORDER: FaqCategory[] = [
  FaqCategory.General,
  FaqCategory.Live,
  FaqCategory.Fantasy,
  FaqCategory.Account,
  FaqCategory.Technical,
];
