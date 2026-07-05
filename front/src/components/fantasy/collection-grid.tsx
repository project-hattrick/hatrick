'use client';

import { HoloPlayerCard } from '@/components/store/holo-player-card';
import { useFantasyStore } from '@/store/fantasy.store';

/** The owned collection (fantasy.store) as a responsive grid of holo cards. */
export function CollectionGrid() {
  const collection = useFantasyStore((s) => s.collection);

  if (!collection.length) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        No players yet — open a pack to start your collection.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
      {collection.map((card, i) => (
        <div key={`${card.name}-${i}`} className="flex justify-center">
          <HoloPlayerCard {...card} width={150} />
        </div>
      ))}
    </div>
  );
}
