'use client';

import { useState } from 'react';

import { OnboardingStep } from '@/enums/onboarding-step.enum';
import { formations } from '@/config/formation.config';
import { useFantasyStore } from '@/store/fantasy.store';
import { useAuthStore } from '@/store/auth.store';
import { fantasyService, type CollectionCard } from '@/services/fantasy.service';
import { pickStartingXI } from './steps/squad-step';

/** Cards a Starter Pack drops — a full XI so the formation editor has an eleven to arrange. */
export const STARTER_PACK_SIZE = 11;

/**
 * Owns the onboarding step machine, pack-overlay state, and the formation editor (shape + player
 * order). Lives in the HOST (login/dev dialog), NOT inside the DialogContent — the host expands
 * its dialog to play the pack, and base-ui unmounts the popup's children, which would otherwise
 * wipe this state.
 */
export function useOnboardingController() {
  const collection = useFantasyStore((s) => s.collection);
  const addToCollection = useFantasyStore((s) => s.addToCollection);
  const setSquad = useFantasyStore((s) => s.setSquad);

  const [step, setStep] = useState<OnboardingStep>(OnboardingStep.Pack);
  const [packOpen, setPackOpen] = useState(false);
  // Collection indices arranged onto the pitch slots, and the active formation shape.
  const [order, setOrder] = useState<number[]>([]);
  const [formationIndex, setFormationIndex] = useState(0);

  const openPack = () => setPackOpen(true);
  const closePack = () => setPackOpen(false);

  const setFormation = (index: number) => setFormationIndex(index);

  const swap = (a: number, b: number) =>
    setOrder((prev) => {
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });

  const lockFormation = () => {
    setSquad(order);
    // Persist the XI server-side when signed in (cards carry their owned copy id).
    if (useAuthStore.getState().status === 'authed') {
      const shape = formations[formationIndex].shape;
      const ownedIds = order.map((i) => collection[i]?.ownedCardId).filter(Boolean) as string[];
      if (ownedIds.length) void fantasyService.saveSquad(shape, ownedIds).catch(() => {});
    }
    setStep(OnboardingStep.Done);
  };

  const completePack = (cards: CollectionCard[]) => {
    addToCollection(cards);
    // The collection was empty, so the pulled cards keep their indices — seed the XI order.
    setOrder(pickStartingXI(cards).map(({ index }) => index));
    setPackOpen(false);
    setStep(OnboardingStep.Squad);
  };

  return {
    collection,
    step,
    packOpen,
    order,
    formations,
    formationIndex,
    formation: formations[formationIndex],
    openPack,
    closePack,
    setFormation,
    swap,
    lockFormation,
    completePack,
  };
}

export type OnboardingController = ReturnType<typeof useOnboardingController>;
