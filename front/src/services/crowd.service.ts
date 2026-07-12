import { env } from '@/lib/env';
import { endpoints } from './endpoints';
import { api } from './http';

/** Crowd chat seam — messages become balloons over the stands for every viewer. */
export const crowdService = {
  sendMessage: async (text: string, fixtureId?: number): Promise<{ ok: boolean }> => {
    if (env.useMock) return { ok: true };
    // Guarded endpoint — goes through the cookie-credentialed client.
    return api.post<{ ok: boolean }>(endpoints.crowd.message, { text, fixtureId });
  },
};
