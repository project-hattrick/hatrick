'use client';

import { z } from 'zod';
import { toast } from 'sonner';
import { useZodForm } from '@/hooks/use-zod-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContactSubject } from '@/enums/contact-subject.enum';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/i18n-provider';

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
  const t = useT();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useZodForm<FormValues>(schema, {
    defaultValues: { subject: ContactSubject.General },
  });

  function onSubmit(_values: FormValues) {
    toast.success(t('pages.contact.form.success'));
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-name">{t('pages.contact.form.name')}</Label>
        <Input
          id="cf-name"
          placeholder={t('pages.contact.form.namePlaceholder')}
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <span className="ml-1 text-xs text-destructive">{errors.name.message}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-email">{t('pages.contact.form.email')}</Label>
        <Input
          id="cf-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && <span className="ml-1 text-xs text-destructive">{errors.email.message}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-subject">{t('pages.contact.form.subject')}</Label>
        <select id="cf-subject" className={selectClass} aria-invalid={!!errors.subject} {...register('subject')}>
          {SUBJECT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.subject && <span className="ml-1 text-xs text-destructive">{errors.subject.message}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-message">{t('pages.contact.form.message')}</Label>
        <textarea
          id="cf-message"
          rows={5}
          placeholder={t('pages.contact.form.messagePlaceholder')}
          className={textareaClass}
          aria-invalid={!!errors.message}
          {...register('message')}
        />
        {errors.message && <span className="ml-1 text-xs text-destructive">{errors.message.message}</span>}
      </div>

      <Button type="submit" shape="pill" size="lg" disabled={isSubmitting} className="self-start">
        {isSubmitting ? t('pages.contact.form.sending') : t('pages.contact.form.send')}
      </Button>
    </form>
  );
}
