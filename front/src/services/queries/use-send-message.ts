'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crowdService } from '../crowd.service';
import { queryKeys } from './keys';
import { useCrowdStore } from '@/store/crowd.store';
import { TeamSide } from '@/enums/team-side.enum';
import { CrowdSource } from '@/enums/crowd-source.enum';
import type { CrowdMessage } from '@/types/crowd';

const SELF = {
  author: 'You',
  side: TeamSide.Home,
  countryCode: 'ARG',
  flag: '🇦🇷',
  avatar: 'https://i.pravatar.cc/64?img=12',
};

/** Sends a crowd message, then streams it into the crowd store. */
export function useSendMessage(fixtureId: number) {
  const queryClient = useQueryClient();
  const add = useCrowdStore((state) => state.add);

  return useMutation({
    mutationFn: (text: string) => crowdService.sendMessage(text),
    onSuccess: (_result, text) => {
      const message: CrowdMessage = {
        id: crypto.randomUUID(),
        author: SELF.author,
        side: SELF.side,
        countryCode: SELF.countryCode,
        flag: SELF.flag,
        avatar: SELF.avatar,
        text,
        ageLabel: 'now',
        source: CrowdSource.Community,
      };
      add(message);
      queryClient.invalidateQueries({ queryKey: queryKeys.crowd(fixtureId) });
    },
  });
}
