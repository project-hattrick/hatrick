import { useQuery } from '@tanstack/react-query';
import { usersMock } from '@/services/mock/users.mock';
import { queryKeys } from './keys';

/** All players in the directory — components use this, never the mock directly. */
export function useDuelists() {
  return useQuery({ queryKey: queryKeys.duelists(), queryFn: usersMock.listDuelists });
}
