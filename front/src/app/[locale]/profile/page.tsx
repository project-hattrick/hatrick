import Link from 'next/link';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { DuelHistoryList } from '@/components/duelists/duel-history-list';
import { CollectionCarousel } from '@/components/profile/collection-carousel';
import { CollectionCount } from '@/components/profile/collection-count';
import { ProfileBets } from '@/components/profile/profile-bets';
import { ProfileHero } from '@/components/profile/profile-hero';
import { StartingXiPreview } from '@/components/profile/starting-xi-preview';
import { WalletActivity } from '@/components/profile/wallet-activity';

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

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassPanel radius="xl" tone="surface" className="flex flex-col overflow-hidden lg:col-span-2">
            <SectionHeader title="Collection" action={<CollectionCount />} />
            <CollectionCarousel />
          </GlassPanel>
          <GlassPanel radius="xl" tone="surface" className="flex flex-col overflow-hidden">
            <SectionHeader
              title="Starting XI"
              action={
                <Link href="/fantasy" className="text-micro text-neon">
                  Manage
                </Link>
              }
            />
            <StartingXiPreview />
          </GlassPanel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <DuelHistoryList />
          <ProfileBets />
          <WalletActivity />
        </div>
      </div>
    </PageShell>
  );
}
