import { create } from 'zustand';
import type { Prediction, PredictionPrompt } from '@/types/prediction';

interface PredictionStore {
  predictions: Prediction[];
  prompt: PredictionPrompt | null;
  add: (prediction: Prediction) => void;
  seed: (predictions: Prediction[]) => void;
  setPrompt: (prompt: PredictionPrompt | null) => void;
}

/** Free-to-play predictions (palpites) and the active prompt. */
export const usePredictionStore = create<PredictionStore>((set) => ({
  predictions: [],
  prompt: null,
  add: (prediction) => set((state) => ({ predictions: [prediction, ...state.predictions].slice(0, 20) })),
  seed: (predictions) => set({ predictions }),
  setPrompt: (prompt) => set({ prompt }),
}));

export const usePredictions = () => usePredictionStore((state) => state.predictions);
export const usePredictionPrompt = () => usePredictionStore((state) => state.prompt);
