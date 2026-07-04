'use client';

import { notFound } from 'next/navigation';
import { useDuelist } from '@/services/queries/use-duelist';
import { WireBlock } from '@/components/common/wire-block';
import { ProfileCover } from './profile-cover';
import { DuelistIdentity } from './duelist-identity';
import { ProfileStatGrid } from './profile-stat-grid';
import { ProfileShowcase } from './profile-showcase';
import { ProfileAchievements } from './profile-achievements';

interface DuelistProfileProps {
  username: string;
}

/** Public profile: banner + identity column + stats / card showcase / achievements. */
export function DuelistProfile({ username }: DuelistProfileProps) {
  const { data: profile, isLoading, isError } = useDuelist(username);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <WireBlock label="Loading profile…" className="h-44" />
        <WireBlock label="Loading stats…" className="h-28" />
      </div>
    );
  }

  if (isError) {
    return <WireBlock label="Failed to load this profile. Please try again." className="h-32" />;
  }

  if (!profile) {
    notFound();
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-1/40">
      <ProfileCover profile={profile} />
      <div className="grid gap-6 px-5 pb-6 sm:px-7 lg:grid-cols-[280px_1fr]">
        <DuelistIdentity profile={profile} />
        <div className="mt-4 flex min-w-0 flex-col gap-4">
          <ProfileStatGrid profile={profile} />
          <ProfileShowcase />
          <ProfileAchievements />
        </div>
      </div>
    </div>
  );
}
