/** Single source of truth for React Query keys — mutations invalidate precise keys only. */
export const queryKeys = {
  authMe: () => ['auth', 'me'] as const,
  walletTransactions: () => ['wallet', 'transactions'] as const,
  fantasySession: () => ['fantasy', 'session'] as const,
  betsSession: () => ['bets', 'session'] as const,
  fixtures: () => ['fixtures'] as const,
  replayCatalog: (days: number) => ['replay', 'catalog', days] as const,
  odds: (fixtureId: number) => ['odds', fixtureId] as const,
  crowd: (fixtureId: number) => ['crowd', fixtureId] as const,
  predictions: (fixtureId: number) => ['predictions', fixtureId] as const,
  duelists: () => ['duelists'] as const,
  duelist: (username: string) => ['duelist', username] as const,
  duelistSearch: (query: string) => ['duelists', 'search', query] as const,
  duels: () => ['duels'] as const,
};
