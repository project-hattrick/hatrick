'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Camera, Check } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { shortAddress } from '@/lib/format';
import { selfProfile } from '@/config/duelists.config';
import { useAuth } from '@/services/queries/use-auth';
import { useProfileStore, type ProfileDraft } from '@/store/profile.store';

/** Field metadata driving the controlled inputs below (id doubles as the ProfileDraft key). */
const FIELDS: Array<{ id: keyof Omit<ProfileDraft, 'bio'>; label: string; placeholder: string }> = [
  { id: 'displayName', label: 'Display name', placeholder: 'Kaua Miguel' },
  { id: 'username', label: 'Username', placeholder: 'kauamigueldev' },
  { id: 'country', label: 'Country', placeholder: 'Brazil' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const saved = useProfileStore();
  const [draft, setDraft] = useState<ProfileDraft>({ displayName: '', username: '', country: '', bio: '' });
  const [savedFlash, setSavedFlash] = useState(false);

  // Seed the form from the persisted store once it's hydrated (session display name as fallback).
  useEffect(() => {
    setDraft({
      displayName: saved.displayName || user?.displayName || '',
      username: saved.username,
      country: saved.country,
      bio: saved.bio,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once per mount, not on each keystroke echo
  }, []);

  const avatarName = draft.displayName || (user ? shortAddress(user.walletAddress) : 'Guest');
  const setField = (id: keyof ProfileDraft, value: string) => setDraft((d) => ({ ...d, [id]: value }));

  const onSave = () => {
    saved.save(draft);
    setSavedFlash(true);
    window.setTimeout(() => router.push('/profile'), 450);
  };

  return (
    <PageShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Edit profile</h1>
          <Link href="/profile" className="text-sm text-muted-foreground transition hover:text-foreground">
            Cancel
          </Link>
        </div>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader title="Avatar" />
          <div className="flex items-center gap-4 p-4 pt-0">
            <span className="grid size-16 shrink-0 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-white/10">
              <Image
                src={selfProfile.portraitSrc}
                alt={avatarName}
                width={64}
                height={64}
                className="translate-y-[6%] scale-110 object-contain object-bottom"
                style={{ imageRendering: 'pixelated' }}
              />
            </span>
            <Button variant="outline" disabled title="Coming soon">
              <Camera className="size-4" /> Change photo
            </Button>
          </div>
        </GlassPanel>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader title="Details" />
          <div className="flex flex-col gap-4 p-4 pt-0">
            {FIELDS.map((field) => (
              <label key={field.id} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                <Input
                  value={draft[field.id]}
                  onChange={(e) => setField(field.id, e.target.value)}
                  placeholder={field.placeholder}
                />
              </label>
            ))}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Bio</span>
              <textarea
                rows={3}
                value={draft.bio}
                onChange={(e) => setField('bio', e.target.value)}
                placeholder="Tell other managers about your squad…"
                className="w-full rounded-lg border border-input bg-input/30 px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
              />
            </label>
          </div>
        </GlassPanel>

        <div className="flex justify-end gap-3">
          <Link href="/profile" className={buttonVariants({ variant: 'ghost' })}>
            Cancel
          </Link>
          <Button onClick={onSave}>
            {savedFlash ? (
              <>
                <Check className="size-4" /> Saved
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
