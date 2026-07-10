'use client';

import { z } from 'zod';

import { ChatCircle } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { useZodForm } from '@/hooks/use-zod-form';
import { usePostRoomMessage } from '@/services/queries';
import { useAuthStore } from '@/store/auth.store';
import { useRoomMessages } from '@/store/room.store';
import { cn } from '@/lib/utils';

const schema = z.object({ body: z.string().trim().min(1).max(200) });
type FormValues = z.infer<typeof schema>;

/**
 * Per-room chat. Reuses the crowd-panel visual shell but is bound to the room
 * store: posts persist over HTTP and the server echoes them to every member over
 * the room socket (see use-room-feed). When `embedded`, it drops its own glass
 * shell + header so it can live inside the room dock as one cohesive surface.
 */
export function RoomChatPanel({ roomId, embedded = false }: { roomId: string; embedded?: boolean }) {
  const messages = useRoomMessages();
  const selfId = useAuthStore((s) => s.user?.id);
  const post = usePostRoomMessage(roomId);
  const form = useZodForm<FormValues>(schema, { defaultValues: { body: '' } });

  const onSubmit = form.handleSubmit((values) => {
    post.mutate(values.body);
    form.reset();
  });

  const body = (
    <>
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col-reverse gap-2 overflow-y-auto overflow-x-hidden p-4">
        {messages.length === 0 ? (
          <span className="m-auto text-xs text-muted-foreground">Say hi to the room 👋</span>
        ) : (
          [...messages].reverse().map((message) => {
            const mine = message.userId === selfId;
            return (
              <div key={message.id} className={cn('flex flex-col gap-0.5', mine && 'items-end')}>
                <span className="text-micro text-muted-foreground">{mine ? 'You' : message.author}</span>
                <span
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-1.5 text-sm',
                    mine ? 'bg-neon/20 text-foreground' : 'bg-surface-2/70 text-foreground',
                  )}
                >
                  {message.body}
                </span>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={onSubmit} className="border-t border-border bg-surface-1/70 p-4">
        <div className="flex items-center rounded-full border border-border/50 bg-surface-3 px-4 py-2.5 transition focus-within:border-muted-foreground/60">
          <input
            {...form.register('body')}
            placeholder="Write a message..."
            autoComplete="off"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
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
