import { env } from '@/lib/env';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export interface FixtureDto {
  FixtureId: number;
  Participant1: string;
  Participant2: string;
  StartTime: number;
}

/** Talks to our backend (which proxies TxLINE). Base seam — adjust paths as the API firms up. */
export const txlineService = {
  getHealth: () => get<{ status: string; service: string }>('/health'),
  getFixtures: async (): Promise<FixtureDto[]> => {
    if (env.useMock) {
      const { MOCK_FIXTURES } = await import('@/services/mock/fixtures.mock');
      return MOCK_FIXTURES;
    }
    return get<FixtureDto[]>('/fixtures');
  },
};
