'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Copy, WhatsappLogo, ShareNetwork, UserPlus, Check, Crown, Users } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { RoomMemberRole } from '@/enums/room-event.enum';
import { duelists } from '@/config/duelists.config';
import { useFriendsStore } from '@/store/friends.store';
import { useRoomMembers, useRoomPresence } from '@/store/room.store';
import { buildWhatsAppUrl, buildXIntentUrl, openShareUrl } from '@/lib/share';
import { cn } from '@/lib/utils';
import { useMemberIdentity } from './use-member-identity';

interface RoomInvitePanelProps {
  inviteToken: string | null;
  /** Localized share URL (already includes the ?t= token). */
  inviteUrl: string;
  /** Drop the outer glass shell + header when hosted inside the room dock. */
  embedded?: boolean;
}

const SHARE_TEXT = 'Come watch the match with me in my private Hatrick room →';
const LIST_SCROLL_CLASS = 'custom-scrollbar max-h-36 overflow-y-auto overscroll-contain pr-1';

/**
 * Invite rail: friends picker (mock friend graph) + a copyable/WhatsApp/X share
 * link. Friends "invited" here are a client-side nudge; the durable membership is
 * whoever actually opens the link and joins (server authority).
 */
export function RoomInvitePanel({ inviteToken, inviteUrl, embedded = false }: RoomInvitePanelProps) {
  const members = useRoomMembers();
  const presence = useRoomPresence();
  const memberIdentity = useMemberIdentity();
  const friendIds = useFriendsStore((s) => s.friendIds);
  const [invited, setInvited] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const friends = useMemo(
    () => duelists.filter((player) => friendIds.includes(player.id)),
    [friendIds],
  );
  const visibleMembers = useMemo(() => {
    const seen = new Set<string>();
    return members.filter((member) => {
      if (seen.has(member.userId)) return false;
      seen.add(member.userId);
      return true;
    });
  }, [members]);

  const copyLink = async () => {
    if (!inviteToken) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invite link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const shareOn = (build: (text: string) => string) =>
    openShareUrl(build(`${SHARE_TEXT} ${inviteUrl}`));

  const toggleInvite = (id: string, name: string) => {
    setInvited((prev) => (prev.includes(id) ? prev : [...prev, id]));
    toast.success(`Invite sent to ${name}`);
  };

  const body = (
    <div data-lenis-prevent className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Share link */}
        <div className="flex flex-col gap-2">
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 bg-surface-2/60 px-3 py-2">
            <ShareNetwork className="size-4 shrink-0 text-neon" />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{inviteUrl}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="min-w-0 gap-1.5" onClick={copyLink} disabled={!inviteToken}>
              {copied ? <Check className="size-3.5 text-neon" /> : <Copy className="size-3.5" />}
              <span className="truncate">Copy</span>
            </Button>
            <Button variant="outline" size="sm" className="min-w-0 gap-1.5" onClick={() => shareOn(buildWhatsAppUrl)}>
              <WhatsappLogo className="size-3.5" />
              <span className="truncate">WhatsApp</span>
            </Button>
            <Button variant="outline" size="sm" className="min-w-0 gap-1.5" onClick={() => shareOn(buildXIntentUrl)}>
              <ShareNetwork className="size-3.5" />
              <span className="truncate">Share</span>
            </Button>
          </div>
        </div>

        {/* Friends picker */}
        {friends.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Friends</span>
            <div data-lenis-prevent className={LIST_SCROLL_CLASS}>
              {friends.map((friend) => {
                const isInvited = invited.includes(friend.id);
                return (
                  <div
                    key={friend.id}
                    className="mb-1.5 flex items-center gap-2 rounded-lg border border-border/40 bg-surface-2/40 px-2.5 py-1.5 last:mb-0"
                  >
                    <UserAvatar src={friend.portraitSrc} alt="" size={28} className="rounded-full" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium" title={friend.name}>
                      {friend.name}
                    </span>
                    <Button
                      variant={isInvited ? 'ghost' : 'outline'}
                      size="xs"
                      className="gap-1"
                      disabled={isInvited}
                      onClick={() => toggleInvite(friend.id, friend.name)}
                    >
                      {isInvited ? <Check className="size-3" /> : <UserPlus className="size-3" />}
                      {isInvited ? 'Invited' : 'Invite'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Members present */}
        <div className="flex flex-col gap-1.5">
          <span className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">In the room</span>
          {visibleMembers.length === 0 ? (
            <span className="text-xs text-muted-foreground">Just you so far — share the link above.</span>
          ) : (
            <div data-lenis-prevent className={LIST_SCROLL_CLASS}>
              {visibleMembers.map((member) => {
                const identity = memberIdentity(member);
                return (
                  <div key={member.id} className="mb-1.5 flex items-center gap-2 rounded-lg px-1 py-1 last:mb-0">
                    <UserAvatar
                      src={identity.avatarSrc}
                      alt=""
                      size={28}
                      className="rounded-full"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium" title={identity.name}>
                      {identity.name}
                    </span>
                    {member.role === RoomMemberRole.Host && (
                      <span className={cn('flex shrink-0 items-center gap-1 text-micro font-semibold text-neon')}>
                        <Crown className="size-3" /> Host
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );

  if (embedded) return body;

  return (
    <GlassPanel tone="surface" className="flex min-h-0 flex-col overflow-hidden">
      <SectionHeader
        title="Invite friends"
        className="border-b border-border bg-surface-1/60"
        action={
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Users className="size-3.5" /> {Math.max(presence, members.length)}
          </span>
        }
      />
      {body}
    </GlassPanel>
  );
}
