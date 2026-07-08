import { api } from '@/services/http';
import type { FixtureDto } from '@/services/txline.service';

/** A finished fixture the backend can replay (mirrors the api ReplayCatalogItem). */
export interface ReplayCatalogItem {
  fixtureId: number;
  home: string;
  away: string;
  competition: string;
  startTime: number;
  epochDay: number;
  startHour: number;
}

export interface StartReplayInput {
  fixtureId: number;
  epochDay: number;
  startHour: number;
  hours?: number;
  speed?: number;
}

/**
 * Talks to our backend's TxLINE replay endpoints. This is a real-backend test
 * surface, so (unlike most services) it never short-circuits on the mock flag.
 */
export const replayService = {
  getCatalog: (days = 6) => api.get<ReplayCatalogItem[]>(`/replay/catalog?days=${days}`),
  getUpcoming: () => api.get<FixtureDto[]>('/fixtures'),
  start: (input: StartReplayInput) => api.post<{ started: boolean; fixtureId: number }>('/replay', input),
  stop: () => api.post<{ stopped: boolean }>('/replay/stop'),
};
