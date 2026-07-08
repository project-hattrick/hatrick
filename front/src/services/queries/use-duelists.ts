import { useQuery } from '@tanstack/react-query';
import { usersMock } from '@/services/mock/users.mock';
import { userService } from '@/services/user.service';
import { backendEnabled } from '@/services/session-mode';
import { queryKeys } from './keys';

/** All players in the directory — real API when integrated, mock otherwise. */
export function useDuelists() {
  return useQuery({
    queryKey: queryKeys.duelists(),
    queryFn: ({ signal }) => (backendEnabled ? userService.listDuelists(signal) : usersMock.listDuelists()),
  });
}
