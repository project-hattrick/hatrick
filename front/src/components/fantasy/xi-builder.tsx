'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SquadStep, pickStartingXI } from '@/components/onboarding/steps/squad-step';
import { formations } from '@/config/formation.config';
import { useFantasyStore } from '@/store/fantasy.store';
import { fantasyService } from '@/services/fantasy.service';
import { isBackendSession } from '@/services/session-mode';

/** Formation editor for /fantasy — owns the pitch order + shape, persists to fantasy.store.squad. */
export function XiBuilder() {
  const collection = useFantasyStore((s) => s.collection);
  const squad = useFantasyStore((s) => s.squad);
  const storedFormation = useFantasyStore((s) => s.formation);
  const setSquad = useFantasyStore((s) => s.setSquad);
  const setStoreFormation = useFantasyStore((s) => s.setFormation);

  const [formationIndex, setFormationIndex] = useState(() => {
    const i = formations.findIndex((f) => f.shape === storedFormation);
    return i >= 0 ? i : 0;
  });
  const [order, setOrder] = useState<number[]>(() =>
    squad.length ? squad : pickStartingXI(collection).map(({ index }) => index),
  );

  const swap = (a: number, b: number) =>
    setOrder((prev) => {
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });

  const save = () => {
    const shape = formations[formationIndex].shape;
    setSquad(order);
    setStoreFormation(shape);
    if (isBackendSession()) {
      const ownedIds = order.map((i) => collection[i]?.ownedCardId).filter(Boolean) as string[];
      if (ownedIds.length) {
        void fantasyService.saveSquad(shape, ownedIds).catch(() => toast.error('Could not sync your XI.'));
      }
    }
    toast.success('Starting XI saved.');
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <SquadStep
        collection={collection}
        order={order}
        formations={formations}
        formationIndex={formationIndex}
        formation={formations[formationIndex]}
        onSwap={swap}
        onSelectFormation={setFormationIndex}
      />
      <Button className="self-start" onClick={save}>
        Save XI
      </Button>
    </div>
  );
}
