import { duelists, selfProfile, type PlayerProfile } from '@/config/duelists.config';

/** Simulate network latency so React Query states behave like the real thing. */
const delay = <T,>(value: T, ms = 140): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

/** Mock user directory — seam for the real API. All access goes through here, never a component. */
export const usersMock = {
  listDuelists: (): Promise<PlayerProfile[]> => delay(duelists),

  getDuelist: (username: string): Promise<PlayerProfile | null> =>
    delay(
      [selfProfile, ...duelists].find((d) => d.username.toLowerCase() === username.toLowerCase()) ?? null,
    ),

  searchDuelists: (query: string): Promise<PlayerProfile[]> => {
    const q = query.trim().toLowerCase();
    if (!q) return delay([], 60);
    const hits = duelists.filter(
      (d) => d.name.toLowerCase().includes(q) || d.username.toLowerCase().includes(q),
    );
    return delay(hits, 90);
  },
};
