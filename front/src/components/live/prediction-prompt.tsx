'use client';

import { PredictionDock } from './prediction-dock';
import { PredictionCard } from './prediction-card';
import { usePredictionPrompt } from '@/store/prediction.store';
import { usePlacePrediction } from '@/services/queries';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';

type PromptVariant = 'dock' | 'card';

/** Live prediction — goal-illustration dock (immersive) or compact card (split). */
export function PredictionPrompt({ variant = 'dock' }: { variant?: PromptVariant }) {
  const prompt = usePredictionPrompt();
  const placePrediction = usePlacePrediction();
  if (!prompt) return null;

  const onPick = (label: string) => {
    const points = label === 'YES' ? prompt.yesPoints : prompt.noPoints;
    placePrediction.mutate({
      fixtureId: MOCK_FIXTURE_ID,
      market: prompt.market,
      label: `${prompt.question} ${label}`,
      points,
    });
  };

  const yes = { label: 'YES', points: prompt.yesPoints, odds: prompt.yesOdds };
  const no = { label: 'NO', points: prompt.noPoints, odds: prompt.noOdds };

  if (variant === 'card') {
    return <PredictionCard question={prompt.question} secondsLeft={prompt.secondsLeft} yes={yes} no={no} onPick={onPick} />;
  }

  return <PredictionDock question={prompt.question} secondsLeft={prompt.secondsLeft} yes={yes} no={no} onPick={onPick} />;
}
