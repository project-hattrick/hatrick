import { IconButton } from '@/components/common/icon-button';
import { ShareNetwork } from '@/components/common/icons';
import { FriendButton } from './friend-button';
import { ChallengeButton } from './challenge-button';
import type { PlayerProfile } from '@/config/duelists.config';

/** Profile banner: dark on-brand gradient + action row (add friend, challenge, share). */
export function ProfileCover({ profile }: { profile: PlayerProfile }) {
  return (
    <div className="relative h-36 overflow-hidden sm:h-44">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-3 via-surface-1 to-surface-deep" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,.03) 0 2px, transparent 2px 92px)',
        }}
      />
      <div aria-hidden className="absolute -top-16 -right-12 size-60 rounded-full border-2 border-neon/10" />
      <div aria-hidden className="absolute inset-x-0 -bottom-px h-24 bg-gradient-to-b from-transparent to-background" />

      <div className="absolute top-4 right-4 flex flex-wrap items-center justify-end gap-2">
        <FriendButton id={profile.id} />
        <ChallengeButton profile={profile} />
        <IconButton label="Share profile" className="border border-border/60 bg-surface-2/60">
          <ShareNetwork className="size-5" />
        </IconButton>
      </div>
    </div>
  );
}
