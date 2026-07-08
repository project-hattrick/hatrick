import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { usersMock } from '@/services/mock/users.mock';
import { userService } from '@/services/user.service';
import { backendEnabled } from '@/services/session-mode';
import { queryKeys } from './keys';

/** Debounced-friendly user search for the ⌘K command palette — real API when integrated. */
export function useSearchDuelists(query: string) {
  return useQuery({
    queryKey: queryKeys.duelistSearch(query),
    queryFn: ({ signal }) =>
      backendEnabled ? userService.searchDuelists(query, signal) : usersMock.searchDuelists(query),
    enabled: query.trim().length > 0,
    placeholderData: keepPreviousData,
  });
}
