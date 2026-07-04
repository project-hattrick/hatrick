import Link from 'next/link';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { WireBlock } from '@/components/common/wire-block';
import { PlayerCard } from '@/components/fantasy/player-card';
import { DuelHistoryList } from '@/components/duelists/duel-history-list';
import { ProfileBets } from '@/components/profile/profile-bets';
import { ProfileHero } from '@/components/profile/profile-hero';
import { userCards } from '@/config/fantasy-cards.config';
import { selfProfile } from '@/config/duelists.config';

interface ProfileSearchParams {
  edit?: string;
}

/**
 * Own profile — the duelist-style profile made personal, with inline editing (?edit=1 opens the
 * form straight away; /profile/edit redirects here).
 */
export default async function ProfilePage({ searchParams }: { searchParams: Promise<ProfileSearchParams> }) {
  const { edit } = await searchParams;

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <ProfileHero initialEdit={edit === '1'} />

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
            <SectionHeader
              title="Collection"
              action={<span className="text-[10px] text-muted-foreground">{userCards.length} players</span>}
            />
            <div className="flex gap-3 overflow-x-auto p-4 pt-0">
              {userCards.map((card) => (
                <PlayerCard key={card.id} card={card} />
              ))}
            </div>
          </GlassPanel>

          <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
            <SectionHeader
              title="Starting XI"
              action={
                <Link href="/fantasy" className="text-[10px] text-neon">
                  Manage
                </Link>
              }
            />
            <WireBlock label="Formation pitch · 11 player slots" className="m-4 h-44" />
          </GlassPanel>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <DuelHistoryList profile={selfProfile} />
          <ProfileBets />
        </div>
      </div>
    </PageShell>
  );
}
