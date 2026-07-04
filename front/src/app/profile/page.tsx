import Link from 'next/link';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { WireBlock } from '@/components/common/wire-block';
import { ProfileIdentity } from '@/components/profile/profile-identity';

export default function ProfilePage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <ProfileIdentity />

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
            <SectionHeader title="Collection" action={<span className="text-[10px] text-muted-foreground">7 players</span>} />
            <div className="grid grid-cols-3 gap-3 p-4 pt-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <WireBlock key={i} label="Player card" className="h-28" />
              ))}
            </div>
          </GlassPanel>

          <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
            <SectionHeader title="Starting XI" action={<Link href="/fantasy" className="text-[10px] text-neon">Manage</Link>} />
            <WireBlock label="Formation pitch · 11 player slots" className="m-4 h-44" />
          </GlassPanel>
        </div>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader title="Bet & prediction history" action={<Link href="/bets" className="text-[10px] text-neon">View all</Link>} />
          <div className="flex flex-col gap-2 p-4 pt-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <WireBlock key={i} label="Bet row — market · stake · odds · status" className="h-12" />
            ))}
          </div>
        </GlassPanel>
      </div>
    </PageShell>
  );
}
