import { env } from '@/lib/env';

/** Crowd chat seam — messages become balloons over the stands. */
export const crowdService = {
  sendMessage: async (text: string): Promise<void> => {
    await fetch(`${env.apiUrl}/crowd/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  },
};
