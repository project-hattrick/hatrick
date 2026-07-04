import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { usersMock } from '@/services/mock/users.mock';
import { queryKeys } from './keys';

/** Debounced-friendly user search for the ⌘K command palette. */
export function useSearchDuelists(query: string) {
  return useQuery({
    queryKey: queryKeys.duelistSearch(query),
    queryFn: () => usersMock.searchDuelists(query),
    enabled: query.trim().length > 0,
    placeholderData: keepPreviousData,
  });
}
