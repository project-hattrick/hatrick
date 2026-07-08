import { useQuery } from '@tanstack/react-query';
import { usersMock } from '@/services/mock/users.mock';
import { userService } from '@/services/user.service';
import { backendEnabled } from '@/services/session-mode';
import { queryKeys } from './keys';

/** A single public profile by username — real API when integrated, mock otherwise. */
export function useDuelist(username: string) {
  return useQuery({
    queryKey: queryKeys.duelist(username),
    queryFn: ({ signal }) =>
      backendEnabled ? userService.getDuelist(username, signal) : usersMock.getDuelist(username),
    enabled: Boolean(username),
  });
}
