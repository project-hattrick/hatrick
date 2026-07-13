'use client';

import { useMemo } from 'react';
import { z } from 'zod';

import { ChatCircle } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { UserAvatar } from '@/components/common/user-avatar';
import { HatBotMessage } from '@/components/crowd/hatbot-message';
import { CrowdSource } from '@/enums/crowd-source.enum';
import { useZodForm } from '@/hooks/use-zod-form';
import { useSelfIdentity } from '@/hooks/use-self-identity';
import { usePostRoomMessage } from '@/services/queries';
import { useAuthStore } from '@/store/auth.store';
import { useCrowdMessages } from '@/store/crowd.store';
import { useRoomMessages, useRoomMembers } from '@/store/room.store';
import { personaFor } from '@/lib/persona-fallback';
import { cn } from '@/lib/utils';
import type { CrowdMessage } from '@/types/crowd';

const schema = z.object({ body: z.string().trim().min(1).max(200) });
type FormValues = z.infer<typeof schema>;

/** One rendered chat row — a member's message or a HatBot line, interleaved by time. */
type ChatItem =
  | { kind: 'user'; id: string; ts: number; userId: string; author: string; body: string }
  | { kind: 'bot'; id: string; ts: number; message: CrowdMessage };

/**
 * Per-room chat. Reuses the crowd-panel visual shell but is bound to the room
 * store: posts persist over HTTP and the server echoes them to every member over
 * the room socket (see use-room-feed). When `embedded`, it drops its own glass
 * shell + header so it can live inside the room dock as one cohesive surface.
 */
export function RoomChatPanel({ roomId, embedded = false }: { roomId: string; embedded?: boolean }) {
  const messages = useRoomMessages();
  const crowd = useCrowdMessages();
  const members = useRoomMembers();
  const selfId = useAuthStore((s) => s.user?.id);
  const self = useSelfIdentity();
  const post = usePostRoomMessage(roomId);
  const form = useZodForm<FormValues>(schema, { defaultValues: { body: '' } });

  // Fuse HatBot into the chat: member messages + the bot's own commentary/nudges, interleaved by time
  // (oldest → newest). The bot lives in the crowd store (ephemeral, per-viewer, never posted to the
  // server); only its HatBot-sourced lines surface here — a private room has no simulated public crowd.
  const items = useMemo<ChatItem[]>(() => {
    const users: ChatItem[] = messages.map((m) => ({
      kind: 'user',
      id: m.id,
      ts: Date.parse(m.createdAt) || 0,
      userId: m.userId,
      author: m.author,
      body: m.body,
    }));
    const bots: ChatItem[] = crowd
      .filter((m) => m.source === CrowdSource.HatBot)
      .map((m) => ({ kind: 'bot', id: m.id, ts: m.ts ?? 0, message: m }));
    return [...users, ...bots].sort((a, b) => a.ts - b.ts);
  }, [messages, crowd]);

  const onSubmit = form.handleSubmit((values) => {
    post.mutate(values.body);
    form.reset();
  });

  // Messages carry no photo — resolve it from the room members (self via identity).
  const avatarOf = (userId: string): string => {
    if (userId === selfId) return self.portraitSrc;
    return members.find((m) => m.userId === userId)?.avatarUrl ?? personaFor(userId);
  };

  const body = (
    <>
      <div data-lenis-prevent className="custom-scrollbar flex min-h-0 flex-1 flex-col-reverse gap-3 overflow-y-auto overflow-x-hidden p-4">
        {items.length === 0 ? (
          <span className="m-auto text-xs text-muted-foreground">Be the first to say hi.</span>
        ) : (
          [...items].reverse().map((item) => {
            if (item.kind === 'bot') return <HatBotMessage key={item.id} message={item.message} />;
            const mine = item.userId === selfId;
            return (
              <div key={item.id} className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}>
                <UserAvatar
                  src={avatarOf(item.userId)}
                  alt={item.author}
                  size={26}
                  className="rounded-full"
                />
                <div className={cn('flex min-w-0 flex-col gap-0.5', mine && 'items-end')}>
                  <span className="text-micro text-muted-foreground">{mine ? 'You' : item.author}</span>
                  <span
                    className={cn(
                      'w-fit max-w-[85%] rounded-2xl px-3 py-1.5 text-sm',
                      mine ? 'bg-neon/20 text-foreground' : 'bg-surface-2/70 text-foreground',
                    )}
                  >
                    {item.body}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={onSubmit} className="border-t border-border bg-surface-1/70 p-4">
        <div className="flex min-w-0 items-center rounded-full border border-border/50 bg-surface-3 px-4 py-2.5 transition focus-within:border-muted-foreground/60">
          <input
            {...form.register('body')}
            placeholder="Write a message..."
            autoComplete="off"
            className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </form>
    </>
  );

  if (embedded) return <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{body}</div>;

  return (
    <GlassPanel tone="surface" className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SectionHeader
        title="Room chat"
        className="border-b border-border bg-surface-1/60"
        action={<ChatCircle className="size-4 text-neon" />}
      />
      {body}
    </GlassPanel>
  );
}
