import { endpoints } from './endpoints';
import { api, ApiError } from './http';
import { toPlayerProfile, type ApiUserDto } from '@/lib/user-mapper';
import type { PlayerProfile } from '@/config/duelists.config';

/** `{ data, meta }` envelope from the paginated /users endpoint. */
interface PaginatedUsers {
  data: ApiUserDto[];
}

/** Real user directory — mirrors `usersMock`, so the query hooks can swap seams by mode. */
const listDuelists = async (signal?: AbortSignal): Promise<PlayerProfile[]> => {
  const res = await api.get<PaginatedUsers>(endpoints.users.list(100), signal);
  return res.data.map(toPlayerProfile);
};

const getDuelist = async (username: string, signal?: AbortSignal): Promise<PlayerProfile | null> => {
  try {
    return toPlayerProfile(await api.get<ApiUserDto>(endpoints.users.byUsername(username), signal));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
};

const searchDuelists = async (query: string, signal?: AbortSignal): Promise<PlayerProfile[]> => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = await listDuelists(signal);
  return all.filter((p) => p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q));
};

export const userService = { listDuelists, getDuelist, searchDuelists };
