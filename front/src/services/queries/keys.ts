/** Single source of truth for React Query keys — mutations invalidate precise keys only. */
export const queryKeys = {
  fixtures: () => ['fixtures'] as const,
  odds: (fixtureId: number) => ['odds', fixtureId] as const,
  crowd: (fixtureId: number) => ['crowd', fixtureId] as const,
  predictions: (fixtureId: number) => ['predictions', fixtureId] as const,
  duelists: () => ['duelists'] as const,
  duelist: (username: string) => ['duelist', username] as const,
  duelistSearch: (query: string) => ['duelists', 'search', query] as const,
};
