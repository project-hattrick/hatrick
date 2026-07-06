'use client';

import { Sparkle } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { PackOpening } from '@/components/store/pack-opening';
import { pickStartingXI } from '@/components/onboarding/steps/squad-step';
import { useFantasyStore } from '@/store/fantasy.store';
import { useAuthStore } from '@/store/auth.store';
import { fantasyService, PackType, type CollectionCard } from '@/services/fantasy.service';
import { usePackDeck } from '@/services/queries/use-pack-deck';

/** Players in the free welcome pack — a full XI to seed the squad (matches the api PackSpec). */
const WELCOME_PACK_SIZE = 11;

/** First-touch hero: open the welcome pack, seed the collection and a starting XI. */
export function WelcomePackPanel() {
  const addToCollection = useFantasyStore((s) => s.addToCollection);
  const setSquad = useFantasyStore((s) => s.setSquad);
  const squad = useFantasyStore((s) => s.squad);
  const formation = useFantasyStore((s) => s.formation);
  const resolveDeck = usePackDeck(PackType.Welcome);

  const onComplete = (cards: CollectionCard[]) => {
    addToCollection(cards);
    // Collection was empty here, so the pulled cards keep their indices — seed the XI order.
    if (!squad.length) {
      const xi = pickStartingXI(cards);
      setSquad(xi.map(({ index }) => index));
      // Persist the seeded XI when signed in (cards carry their owned copy id).
      if (useAuthStore.getState().status === 'authed') {
        const ownedIds = xi.map(({ index }) => cards[index]?.ownedCardId).filter(Boolean) as string[];
        if (ownedIds.length) void fantasyService.saveSquad(formation, ownedIds).catch(() => {});
      }
    }
  };

  return (
    <GlassPanel radius="xl" tone="dark" className="overflow-hidden p-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-neon uppercase">
            <Sparkle className="size-3.5" /> Welcome pack
          </span>
          <h2 className="text-xl font-bold">Open your pack of {WELCOME_PACK_SIZE} players</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Reveal real players with live, evolving attributes. Build your squad from what you pull.
          </p>
        </div>
        <PackOpening
          packName="Welcome Pack"
          packSize={WELCOME_PACK_SIZE}
          ctaSize="lg"
          cta="Open pack"
          onComplete={onComplete}
          resolveDeck={resolveDeck}
        />
      </div>
    </GlassPanel>
  );
}
