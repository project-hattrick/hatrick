'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Flag } from '@/components/common/flag';
import { CalendarDots, Camera, Check, CircleNotch, Coins, Crown, Wallet } from '@/components/common/icons';
import { TierBadge } from '@/components/duelists/tier-badge';
import { PresenceDot } from '@/components/duelists/presence-dot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fifaToIso } from '@/lib/country';
import { formatThousands, shortAddress } from '@/lib/format';
import { cn } from '@/lib/utils';
import { selfProfile } from '@/config/duelists.config';
import { avatarOptions, formatJoined, rankFromRating } from '@/config/profile-mock';
import { useAuth } from '@/services/queries/use-auth';
import { useUpdateProfile } from '@/services/queries/use-update-profile';
import { backendEnabled } from '@/services/session-mode';
import { useProfileStore, type ProfileDraft } from '@/store/profile.store';

/** Uploaded photos are stored as data URLs; presets are `/personas/*` paths (pixel-art). */
const isUploadedPhoto = (src: string): boolean => src.startsWith('data:');

/** Max upload size (kept small — the data URL lives in localStorage). */
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Avatar image props differ for real photos (cover-crop, smooth) vs pixel-art personas. */
function avatarImageProps(src: string) {
  return isUploadedPhoto(src)
    ? { className: 'size-full object-cover', style: undefined }
    : {
        className: 'translate-y-[6%] scale-110 object-contain object-bottom',
        style: { imageRendering: 'pixelated' as const },
      };
}

function MiniStat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className={cn('font-mono text-lg font-bold tabular-nums', accent ? 'text-neon' : 'text-foreground')}>
        {value}
      </span>
      <span className="text-micro text-muted-foreground">{label}</span>
    </div>
  );
}

/** Inline editor for the personal fields — seeded from the store when edit mode mounts. */
function IdentityEditForm({ fallbackName, onDone }: { fallbackName: string; onDone: () => void }) {
  const [draft, setDraft] = useState<ProfileDraft>(() => {
    const s = useProfileStore.getState();
    return {
      displayName: s.displayName || fallbackName,
      username: s.username,
      country: s.country,
      bio: s.bio,
      portraitSrc: s.portraitSrc,
    };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const { isAuthenticated } = useAuth();
  const updateProfile = useUpdateProfile();

  const setField = (id: keyof ProfileDraft, value: string) => setDraft((d) => ({ ...d, [id]: value }));

  const save = () => {
    setSaveError('');
    // Usernames are handle-style server-side (no leading @).
    const clean: ProfileDraft = { ...draft, username: draft.username.replace(/^@+/, '').trim() };
    useProfileStore.getState().save(clean); // instant local paint
    if (!isAuthenticated || !backendEnabled) {
      onDone(); // guest or mock mode — local only, nothing to persist
      return;
    }
    updateProfile.mutate(clean, {
      onSuccess: () => onDone(),
      onError: (e) => setSaveError((e as Error)?.message ?? 'Could not save your profile'),
    });
  };

  const handleFile = (file: File | undefined) => {
    setUploadError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setUploadError('Image is too large (max 2 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField('portraitSrc', String(reader.result));
    reader.onerror = () => setUploadError('Could not read that file.');
    reader.readAsDataURL(file);
  };

  const uploaded = isUploadedPhoto(draft.portraitSrc);

  // maxLength mirrors the api UpdateProfileDto so the form can't produce a 400.
  const fields: Array<{
    id: keyof Omit<ProfileDraft, 'bio'>;
    label: string;
    placeholder: string;
    maxLength: number;
  }> = [
    { id: 'displayName', label: 'Display name', placeholder: 'Kaua Miguel', maxLength: 32 },
    { id: 'username', label: 'Username', placeholder: 'kauamigueldev', maxLength: 24 },
    { id: 'country', label: 'Country', placeholder: 'Brazil', maxLength: 56 },
  ];

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Avatar</span>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'grid size-12 place-items-center overflow-hidden rounded-lg bg-gradient-to-b from-surface-3 to-surface-deep ring-2 transition',
              uploaded ? 'ring-neon' : 'ring-dashed ring-border text-muted-foreground hover:ring-neon/40',
            )}
            aria-label="Upload a photo"
            aria-pressed={uploaded}
          >
            {uploaded ? (
              <Image src={draft.portraitSrc} alt="" width={48} height={48} className="size-full object-cover" unoptimized />
            ) : (
              <Camera className="size-5" />
            )}
          </button>
          {avatarOptions.map((src) => {
            const selected = src === (draft.portraitSrc || selfProfile.portraitSrc);
            return (
              <button
                key={src}
                type="button"
                aria-pressed={selected}
                onClick={() => setField('portraitSrc', src)}
                className={cn(
                  'grid size-12 place-items-end overflow-hidden rounded-lg bg-gradient-to-b from-surface-3 to-surface-deep ring-2 transition',
                  selected ? 'ring-neon' : 'ring-transparent hover:ring-neon/40',
                )}
              >
                <Image
                  src={src}
                  alt=""
                  width={48}
                  height={48}
                  className="translate-y-[6%] scale-110 object-contain object-bottom"
                  style={{ imageRendering: 'pixelated' }}
                />
              </button>
            );
          })}
        </div>
        {uploadError ? <span className="text-micro text-hot">{uploadError}</span> : null}
      </div>
      {fields.map((field) => (
        <label key={field.id} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
          <Input
            value={draft[field.id]}
            onChange={(e) => setField(field.id, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
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
          maxLength={280}
          className="w-full rounded-lg border border-input bg-input/30 px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
        />
      </label>
      {saveError ? <span className="text-micro text-hot">{saveError}</span> : null}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={save} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? (
            <CircleNotch className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}{' '}
          {updateProfile.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={updateProfile.isPending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

interface ProfileIdentityProps {
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}

/**
 * Own-profile identity column — same shape as DuelistIdentity (avatar over the cover, name, tier,
 * mini stats, meta) plus the personal bits (wallet, coins) and the inline edit form.
 */
export function ProfileIdentity({ editing, onEditingChange }: ProfileIdentityProps) {
  const { isAuthenticated, user } = useAuth();
  const draft = useProfileStore();

  const wallet = user?.walletAddress ?? null;
  const displayName = draft.displayName || user?.displayName || (wallet ? shortAddress(wallet) : 'Guest');
  const handle = draft.username ? draft.username.replace(/^@/, '') : wallet ? shortAddress(wallet) : 'guest';
  const bio = draft.bio || selfProfile.bio;
  const country = draft.country || 'Brazil';
  const rank = rankFromRating(selfProfile.rating);

  return (
    <div className="flex flex-col">
      <span className="relative z-10 -mt-14 grid size-24 shrink-0 place-items-end overflow-hidden rounded-2xl bg-gradient-to-b from-surface-3 to-surface-deep shadow-e3 ring-2 ring-neon/30">
        {(() => {
          const src = draft.portraitSrc || selfProfile.portraitSrc;
          const { className, style } = avatarImageProps(src);
          return (
            <Image
              src={src}
              alt={displayName}
              width={96}
              height={96}
              className={className}
              style={style}
              unoptimized={isUploadedPhoto(src)}
            />
          );
        })()}
      </span>

      <div className="mt-3 flex items-center gap-2">
        <h1 className="text-title">{displayName}</h1>
        <span className="grid size-5 place-items-center rounded-full bg-neon text-primary-foreground">
          <Crown className="size-3" weight="fill" />
        </span>
      </div>
      <span className="text-micro mt-0.5 font-mono text-muted-foreground">@{handle}</span>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TierBadge tier={selfProfile.tier} division={selfProfile.division} />
        <PresenceDot presence={selfProfile.presence} showLabel />
      </div>

      <div className="mt-4 flex gap-6">
        <MiniStat value={String(selfProfile.wins)} label="Wins" />
        <MiniStat value={String(selfProfile.losses)} label="Losses" />
        <MiniStat value={`#${rank}`} label="Rank" accent />
      </div>

      {editing ? (
        <IdentityEditForm fallbackName={user?.displayName ?? ''} onDone={() => onEditingChange(false)} />
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Wallet className="size-4" />
              <span>
                {wallet ? (
                  <>
                    <b className="font-semibold text-foreground">{shortAddress(wallet)}</b> · devnet
                  </>
                ) : (
                  'Connect your wallet to sign in'
                )}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <Coins className="size-4" />
              <span>
                <b className="font-semibold text-foreground">
                  {isAuthenticated && user ? formatThousands(Number(user.balance)) : '—'}
                </b>{' '}
                coins
              </span>
            </span>
            <span className="flex items-center gap-2">
              <Flag code={fifaToIso(selfProfile.country)} className="text-sm" />
              <span>
                Represents <b className="font-semibold text-foreground">{country}</b>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <CalendarDots className="size-4" />
              <span>
                Joined <b className="font-semibold text-foreground">{formatJoined(selfProfile.joinedAt)}</b>
              </span>
            </span>
          </div>

          {bio ? <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{bio}</p> : null}
        </>
      )}
    </div>
  );
}
