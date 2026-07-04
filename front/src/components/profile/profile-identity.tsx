'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Flag } from '@/components/common/flag';
import { CalendarDots, Check, Coins, Crown, Wallet } from '@/components/common/icons';
import { TierBadge } from '@/components/duelists/tier-badge';
import { PresenceDot } from '@/components/duelists/presence-dot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fifaToIso } from '@/lib/country';
import { formatThousands, shortAddress } from '@/lib/format';
import { cn } from '@/lib/utils';
import { selfProfile } from '@/config/duelists.config';
import { formatJoined, rankFromRating } from '@/config/profile-mock';
import { useAuth } from '@/services/queries/use-auth';
import { useProfileStore, type ProfileDraft } from '@/store/profile.store';

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
    };
  });

  const setField = (id: keyof ProfileDraft, value: string) => setDraft((d) => ({ ...d, [id]: value }));
  const save = () => {
    useProfileStore.getState().save(draft);
    onDone();
  };

  const fields: Array<{ id: keyof Omit<ProfileDraft, 'bio'>; label: string; placeholder: string }> = [
    { id: 'displayName', label: 'Display name', placeholder: 'Kaua Miguel' },
    { id: 'username', label: 'Username', placeholder: 'kauamigueldev' },
    { id: 'country', label: 'Country', placeholder: 'Brazil' },
  ];

  return (
    <div className="mt-3 flex flex-col gap-3">
      {fields.map((field) => (
        <label key={field.id} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
          <Input value={draft[field.id]} onChange={(e) => setField(field.id, e.target.value)} placeholder={field.placeholder} />
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
      <div className="flex gap-2">
        <Button className="flex-1" onClick={save}>
          <Check className="size-4" /> Save
        </Button>
        <Button variant="ghost" onClick={onDone}>
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
      <span className="-mt-14 grid size-24 shrink-0 place-items-end overflow-hidden rounded-2xl bg-gradient-to-b from-surface-3 to-surface-deep shadow-xl ring-2 ring-neon/30">
        <Image
          src={selfProfile.portraitSrc}
          alt={displayName}
          width={96}
          height={96}
          className="translate-y-[6%] scale-110 object-contain object-bottom"
          style={{ imageRendering: 'pixelated' }}
        />
      </span>

      <div className="mt-3 flex items-center gap-2">
        <h1 className="text-xl font-bold">{displayName}</h1>
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
