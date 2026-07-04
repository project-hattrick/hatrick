'use client';

import { useState } from 'react';
import { IconButton } from '@/components/common/icon-button';
import { Pencil, ShareNetwork } from '@/components/common/icons';
import { Button } from '@/components/ui/button';
import { ProfileCover } from '@/components/duelists/profile-cover';
import { ProfileStatGrid } from '@/components/duelists/profile-stat-grid';
import { ProfileAchievements } from '@/components/duelists/profile-achievements';
import { selfProfile } from '@/config/duelists.config';
import { ProfileIdentity } from './profile-identity';

/**
 * Own-profile hero — the duelist public-profile shell (cover + identity column + stats +
 * achievements) made personal: the cover action is Edit, and the identity column edits inline.
 */
export function ProfileHero({ initialEdit = false }: { initialEdit?: boolean }) {
  const [editing, setEditing] = useState(initialEdit);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-1/40">
      <ProfileCover
        profile={selfProfile}
        actions={
          <>
            <Button size="sm" variant={editing ? 'secondary' : 'outline'} onClick={() => setEditing(!editing)}>
              <Pencil className="size-4" /> {editing ? 'Editing…' : 'Edit profile'}
            </Button>
            <IconButton label="Share profile" className="border border-border/60 bg-surface-2/60">
              <ShareNetwork className="size-5" />
            </IconButton>
          </>
        }
      />
      <div className="grid gap-6 px-5 pb-6 sm:px-7 lg:grid-cols-[280px_1fr]">
        <ProfileIdentity editing={editing} onEditingChange={setEditing} />
        <div className="mt-4 flex min-w-0 flex-col gap-4">
          <ProfileStatGrid profile={selfProfile} />
          <ProfileAchievements />
        </div>
      </div>
    </div>
  );
}
