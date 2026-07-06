import Link from 'next/link';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { DuelHistoryList } from '@/components/duelists/duel-history-list';
import { CollectionCarousel } from '@/components/profile/collection-carousel';
import { ProfileBets } from '@/components/profile/profile-bets';
import { ProfileHero } from '@/components/profile/profile-hero';
import { StartingXiPreview } from '@/components/profile/starting-xi-preview';
import { WalletActivity } from '@/components/profile/wallet-activity';
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

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader
            title="Collection"
            action={<span className="text-[10px] text-muted-foreground">{userCards.length} players</span>}
          />
          <CollectionCarousel />
        </GlassPanel>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <DuelHistoryList profile={selfProfile} />
          <ProfileBets />
          <WalletActivity />
          <GlassPanel radius="xl" tone="surface" className="overflow-hidden lg:col-span-2 xl:col-span-1">
            <SectionHeader
              title="Starting XI"
              action={
                <Link href="/fantasy" className="text-[10px] text-neon">
                  Manage
                </Link>
              }
            />
            <StartingXiPreview />
          </GlassPanel>
        </div>
      </div>
    </PageShell>
  );
}
