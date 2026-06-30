'use client';

import { LivePredictionBar } from './live-prediction-bar';
import type { PredictionOption } from './option-buttons';
import { usePredictionPrompt } from '@/store/prediction.store';
import { usePlacePrediction } from '@/services/queries';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';
import { MarketType } from '@/enums/market-type.enum';

/** Bottom-center live prediction prompt — adapts the active prompt into the DS bar. */
export function PredictionPrompt() {
  const prompt = usePredictionPrompt();
  const placePrediction = usePlacePrediction();
  if (!prompt) return null;

  const options: PredictionOption[] = [
    { label: 'YES', points: prompt.yesPoints, kind: 'primary' },
    { label: 'NO', points: prompt.noPoints, kind: 'secondary' },
  ];

  const onPick = (label: string) => {
    const points = label === 'YES' ? prompt.yesPoints : prompt.noPoints;
    placePrediction.mutate({
      fixtureId: MOCK_FIXTURE_ID,
      market: prompt.market,
      label: `${prompt.question} ${label}`,
      points,
    });
  };

  return (
    <LivePredictionBar
      market={prompt.market}
      emphasis={prompt.market === MarketType.Cards ? 'rare' : 'standard'}
      question={prompt.question}
      windowLabel="Next minute"
      options={options}
      countdown={{ seconds: prompt.secondsLeft, max: 60 }}
      onPick={onPick}
    />
  );
}
