import { PlayerCard } from '@/components/fantasy/player-card';
import { userCards } from '@/config/fantasy-cards.config';

/** Card showcase — the player's featured collectibles (reuses the Fantasy PlayerCard). */
export function ProfileShowcase() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-bold text-foreground">Card showcase</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {userCards.slice(0, 3).map((card) => (
          <PlayerCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
