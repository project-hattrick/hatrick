'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SquadStep, pickStartingXI } from '@/components/onboarding/steps/squad-step';
import { formations } from '@/config/formation.config';
import { useFantasyStore } from '@/store/fantasy.store';

/** Formation editor for /fantasy — owns the pitch order + shape, persists to fantasy.store.squad. */
export function XiBuilder() {
  const collection = useFantasyStore((s) => s.collection);
  const squad = useFantasyStore((s) => s.squad);
  const setSquad = useFantasyStore((s) => s.setSquad);

  const [formationIndex, setFormationIndex] = useState(0);
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
    setSquad(order);
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
