'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { predictionService, type PlacePredictionInput } from '../prediction.service';
import { queryKeys } from './keys';
import { useRequireAuth } from './use-require-auth';
import { usePredictionStore } from '@/store/prediction.store';
import { PredictionStatus } from '@/enums/prediction-status.enum';
import type { Prediction } from '@/types/prediction';

/** Places a free-to-play prediction, then streams it into the prediction store. */
export function usePlacePrediction() {
  const queryClient = useQueryClient();
  const add = usePredictionStore((state) => state.add);
  const requireAuth = useRequireAuth();

  return useMutation({
    mutationFn: (input: PlacePredictionInput) => {
      if (!requireAuth()) {
        return Promise.reject(
          new Error('Sign in with your wallet to make a prediction'),
        );
      }
      return predictionService.place(input);
    },
    onSuccess: (_result, input) => {
      const prediction: Prediction = {
        id: crypto.randomUUID(),
        market: input.market,
        label: input.label,
        status: PredictionStatus.Pending,
        points: input.points,
      };
      add(prediction);
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions(input.fixtureId) });
    },
  });
}
