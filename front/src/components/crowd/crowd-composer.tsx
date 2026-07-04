'use client';

import { z } from 'zod';
import { useZodForm } from '@/hooks/use-zod-form';
import { useSendMessage } from '@/services/queries';

const schema = z.object({ text: z.string().trim().min(1).max(200) });
type FormValues = z.infer<typeof schema>;

/** Crowd chat input (React Hook Form + zod). */
export function CrowdComposer({ fixtureId }: { fixtureId: number }) {
  const sendMessage = useSendMessage(fixtureId);
  const form = useZodForm<FormValues>(schema, { defaultValues: { text: '' } });

  const onSubmit = form.handleSubmit((values) => {
    sendMessage.mutate(values.text);
    form.reset();
  });

  return (
    <form onSubmit={onSubmit} className="p-4">
      <div className="flex items-center rounded-full border border-border/50 bg-surface-3 px-4 py-2.5 transition focus-within:border-muted-foreground/60">
        <input
          {...form.register('text')}
          placeholder="Write a message..."
          autoComplete="off"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </form>
  );
}
