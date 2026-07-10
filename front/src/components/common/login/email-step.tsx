'use client';

import { z } from 'zod';

import { ArrowLeft, CircleNotch, Envelope } from '@/components/common/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useZodForm } from '@/hooks/use-zod-form';
import { useEmailSignInMutation } from '@/services/queries/use-email-sign-in';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

/**
 * Email sign-in-or-register (Collector tier). One form for both: a new email
 * creates the account, an existing one just needs the right password.
 */
export function EmailStep({ onBack }: { onBack: () => void }) {
  const signIn = useEmailSignInMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useZodForm<FormValues>(schema, { defaultValues: { email: '', password: '' } });

  const onSubmit = (values: FormValues) => {
    if (signIn.isPending) return;
    signIn.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-caption font-semibold text-foreground">
          Email
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && <span className="ml-1 text-xs text-destructive">{errors.email.message}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-caption font-semibold text-foreground">
          Password
        </label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <span className="ml-1 text-xs text-destructive">{errors.password.message}</span>
        )}
      </div>

      {signIn.isError && (
        <p className="text-xs text-destructive">
          {(signIn.error as Error)?.message ?? 'Sign-in failed — try again.'}
        </p>
      )}

      <Button
        type="submit"
        className="h-12 w-full rounded-[18px] text-sm font-semibold"
        disabled={signIn.isPending}
      >
        {signIn.isPending ? (
          <CircleNotch className="size-4 animate-spin" />
        ) : (
          <Envelope className="size-4" />
        )}
        Continue
      </Button>

      <p className="text-center text-micro text-muted-foreground">
        New email? We&apos;ll create your Collector account — packs and stats, no wallet needed.
      </p>

      <button
        type="button"
        onClick={onBack}
        className="mx-auto flex cursor-pointer items-center gap-1.5 text-caption font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to all sign-in options
      </button>
    </form>
  );
}
