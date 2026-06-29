import { env } from '@/lib/env';

/** Fantasy packs/market seam. */
export const fantasyService = {
  openWelcomePack: async (): Promise<number[]> => {
    const res = await fetch(`${env.apiUrl}/fantasy/welcome-pack`, { method: 'POST' });
    return res.ok ? ((await res.json()) as number[]) : [];
  },
};
