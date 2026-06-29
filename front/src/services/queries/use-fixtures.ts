import { useQuery } from '@tanstack/react-query';
import { txlineService } from '../txline.service';
import { queryKeys } from './keys';

/** React Query hook over txlineService — components use this, never fetch directly. */
export function useFixtures() {
  return useQuery({ queryKey: queryKeys.fixtures(), queryFn: txlineService.getFixtures });
}
