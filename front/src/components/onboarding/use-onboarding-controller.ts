'use client';

import { useState } from 'react';

import { OnboardingStep } from '@/enums/onboarding-step.enum';
import { useFantasyStore } from '@/store/fantasy.store';
import type { PackCard } from '@/config/pack-pool.config';
import { pickStartingXI } from './steps/squad-step';

/**
 * Owns the onboarding step machine + pack-overlay state. Lives in the HOST (login/dev dialog),
 * NOT inside the DialogContent — the host hides its dialog while the full-screen pack plays, and
 * base-ui unmounts the popup's children, which would otherwise wipe the step state and the overlay.
 */
export function useOnboardingController() {
  const collection = useFantasyStore((s) => s.collection);
  const squad = useFantasyStore((s) => s.squad);
  const addToCollection = useFantasyStore((s) => s.addToCollection);
  const setSquad = useFantasyStore((s) => s.setSquad);

  const [step, setStep] = useState<OnboardingStep>(OnboardingStep.Pack);
  const [packOpen, setPackOpen] = useState(false);

  const openPack = () => setPackOpen(true);
  const closePack = () => setPackOpen(false);

  const lockFormation = () => {
    setSquad(pickStartingXI(collection).map(({ index }) => index));
    setStep(OnboardingStep.Done);
  };

  const completePack = (cards: PackCard[]) => {
    addToCollection(cards);
    setPackOpen(false);
    setStep(OnboardingStep.Squad);
  };

  return { collection, squad, step, packOpen, openPack, closePack, lockFormation, completePack };
}

export type OnboardingController = ReturnType<typeof useOnboardingController>;
