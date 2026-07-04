import { useQuery } from '@tanstack/react-query';
import { usersMock } from '@/services/mock/users.mock';
import { queryKeys } from './keys';

/** A single public profile by username. */
export function useDuelist(username: string) {
  return useQuery({
    queryKey: queryKeys.duelist(username),
    queryFn: () => usersMock.getDuelist(username),
    enabled: Boolean(username),
  });
}
