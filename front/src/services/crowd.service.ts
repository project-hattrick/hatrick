import { env } from '@/lib/env';

/** Crowd chat seam — messages become balloons over the stands. */
export const crowdService = {
  sendMessage: async (text: string): Promise<{ ok: boolean }> => {
    if (env.useMock) return { ok: true };
    const res = await fetch(`${env.apiUrl}/crowd/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return { ok: res.ok };
  },
};
