'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Copy, WhatsappLogo, ShareNetwork, UserPlus, Check, Crown, Users } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { Button } from '@/components/ui/button';
import { RoomMemberRole } from '@/enums/room-event.enum';
import { duelists } from '@/config/duelists.config';
import { useFriendsStore } from '@/store/friends.store';
import { useRoomMembers, useRoomPresence } from '@/store/room.store';
import { buildWhatsAppUrl, buildXIntentUrl, openShareUrl } from '@/lib/share';
import { cn } from '@/lib/utils';

interface RoomInvitePanelProps {
  inviteToken: string | null;
  /** Localized share URL (already includes the ?t= token). */
  inviteUrl: string;
  /** Drop the outer glass shell + header when hosted inside the room dock. */
  embedded?: boolean;
}

const SHARE_TEXT = 'Come watch the match with me in my private Hat-trick room →';

/**
 * Invite rail: friends picker (mock friend graph) + a copyable/WhatsApp/X share
 * link. Friends "invited" here are a client-side nudge; the durable membership is
 * whoever actually opens the link and joins (server authority).
 */
export function RoomInvitePanel({ inviteToken, inviteUrl, embedded = false }: RoomInvitePanelProps) {
  const members = useRoomMembers();
  const presence = useRoomPresence();
  const friendIds = useFriendsStore((s) => s.friendIds);
  const [invited, setInvited] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const friends = useMemo(
    () => duelists.filter((player) => friendIds.includes(player.id)),
    [friendIds],
  );

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
    <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Share link */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface-2/60 px-3 py-2">
            <ShareNetwork className="size-4 shrink-0 text-neon" />
            <span className="truncate text-xs text-muted-foreground">{inviteUrl}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={copyLink} disabled={!inviteToken}>
              {copied ? <Check className="size-3.5 text-neon" /> : <Copy className="size-3.5" />}
              Copy
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => shareOn(buildWhatsAppUrl)}>
              <WhatsappLogo className="size-3.5" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => shareOn(buildXIntentUrl)}>
              <ShareNetwork className="size-3.5" />
              Share
            </Button>
          </div>
        </div>

        {/* Friends picker */}
        {friends.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Friends</span>
            {friends.map((friend) => {
              const isInvited = invited.includes(friend.id);
              return (
                <div
                  key={friend.id}
                  className="flex items-center gap-2 rounded-lg border border-border/40 bg-surface-2/40 px-2.5 py-1.5"
                >
                  <span className="size-6 shrink-0 rounded-full bg-gradient-to-br from-surface-3 to-surface-deep" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{friend.name}</span>
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
        )}

        {/* Members present */}
        <div className="flex flex-col gap-1.5">
          <span className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">In the room</span>
          {members.length === 0 ? (
            <span className="text-xs text-muted-foreground">Just you so far — share the link above.</span>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 px-1 py-1">
                <span className="size-6 shrink-0 rounded-full bg-gradient-to-br from-neon/40 to-neon/5" />
                <span className="min-w-0 flex-1 truncate text-sm">{member.displayName}</span>
                {member.role === RoomMemberRole.Host && (
                  <span className={cn('flex items-center gap-1 text-micro font-semibold text-neon')}>
                    <Crown className="size-3" /> Host
                  </span>
                )}
              </div>
            ))
          )}
        </div>
    </div>
  );

  if (embedded) return body;

  return (
    <GlassPanel tone="surface" className="flex flex-col overflow-hidden">
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
