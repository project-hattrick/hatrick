'use client';

import { z } from 'zod';
import { toast } from 'sonner';
import { useZodForm } from '@/hooks/use-zod-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContactSubject } from '@/enums/contact-subject.enum';
import { cn } from '@/lib/utils';

const SUBJECT_OPTIONS = Object.values(ContactSubject);

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  subject: z.nativeEnum(ContactSubject, { message: 'Select a subject' }),
  message: z.string().min(20, 'Message must be at least 20 characters').max(2000),
});

type FormValues = z.infer<typeof schema>;

const textareaClass = cn(
  'w-full min-w-0 resize-none rounded-[18px] border border-border bg-surface-1',
  'px-5 py-3.5 text-sm text-foreground outline-none transition-colors',
  'placeholder:text-muted-foreground focus-visible:border-foreground/40',
  'disabled:pointer-events-none disabled:opacity-50',
);

const selectClass = cn(
  'w-full min-w-0 appearance-none rounded-[18px] border border-border bg-surface-2',
  'px-5 py-3.5 text-sm text-foreground outline-none transition-colors',
  'focus-visible:border-foreground/40 disabled:pointer-events-none disabled:opacity-50',
);

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useZodForm<FormValues>(schema, {
    defaultValues: { subject: ContactSubject.General },
  });

  function onSubmit(_values: FormValues) {
    // No real network — static demo.
    toast.success("Thanks — we'll be in touch.");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-name">Name</Label>
        <Input
          id="cf-name"
          placeholder="Your name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && (
          <span className="ml-1 text-xs text-destructive">{errors.name.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-email">Email</Label>
        <Input
          id="cf-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <span className="ml-1 text-xs text-destructive">{errors.email.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-subject">Subject</Label>
        <select
          id="cf-subject"
          className={selectClass}
          aria-invalid={!!errors.subject}
          {...register('subject')}
        >
          {SUBJECT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {errors.subject && (
          <span className="ml-1 text-xs text-destructive">{errors.subject.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-message">Message</Label>
        <textarea
          id="cf-message"
          rows={5}
          placeholder="Tell us how we can help…"
          className={textareaClass}
          aria-invalid={!!errors.message}
          {...register('message')}
        />
        {errors.message && (
          <span className="ml-1 text-xs text-destructive">{errors.message.message}</span>
        )}
      </div>

      <Button
        type="submit"
        shape="pill"
        size="lg"
        disabled={isSubmitting}
        className="self-start"
      >
        {isSubmitting ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
