import { useQuery } from '@tanstack/react-query';
import { txlineService } from '../txline.service';

/** React Query hook over txlineService — components use this, never fetch directly. */
export function useFixtures() {
  return useQuery({ queryKey: ['fixtures'], queryFn: txlineService.getFixtures });
}
