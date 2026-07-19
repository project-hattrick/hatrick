'use client';

import { useState } from 'react';
import { useLoginWithEmail, usePrivy } from '@privy-io/react-auth';
import { z } from 'zod';

import { ArrowLeft, CircleNotch, Envelope, Check, Warning } from '@/components/common/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useZodForm } from '@/hooks/use-zod-form';

const emailSchema = z.object({ email: z.string().email('Enter a valid email') });
const codeSchema = z.object({ code: z.string().length(6, 'Enter the 6-digit code') });

type EmailValues = z.infer<typeof emailSchema>;
type CodeValues = z.infer<typeof codeSchema>;

/**
 * Email OTP login/signup — fully embedded, no Privy modal.
 * Phase 1: email → sendCode. Phase 2: OTP input → loginWithCode.
 * On success, useWalletAuth picks up Privy's authenticated state and exchanges
 * the token via POST /auth/login, setting the backend session cookie.
 */
export function EmailStep({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'email' | 'code'>('email');
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sendCode, loginWithCode, state } = useLoginWithEmail();
  const { authenticated, logout: privyLogout } = usePrivy();

  const emailForm = useZodForm<EmailValues>(emailSchema, { defaultValues: { email: '' } });
  const codeForm = useZodForm<CodeValues>(codeSchema, { defaultValues: { code: '' } });

  const handleSend = async ({ email }: EmailValues) => {
    setError(null);
    setBusy(true);
    try {
      // Clear any stale Privy session first, so loginWithCode logs the user in
      // instead of trying to link this email to a leftover authenticated session.
      if (authenticated) await privyLogout();

      await sendCode({ email });
      setSentTo(email);
      setPhase('code');
    } catch (e) {
      setError((e as Error)?.message ?? 'Failed to send code. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async ({ code }: CodeValues) => {
    setError(null);
    setBusy(true);
    try {
      await loginWithCode({ code });
      // success — useWalletAuth driver picks it up automatically
    } catch (e) {
      setError((e as Error)?.message ?? 'Invalid code. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'code') {
    return (
      <form onSubmit={codeForm.handleSubmit(handleVerify)} noValidate className="space-y-4">
        <div className="flex flex-col items-center gap-2 pb-1 text-center">
          <div className="grid size-12 place-items-center rounded-full border border-neon/30 bg-neon/5">
            <Envelope className="size-5 text-neon" />
          </div>
          <p className="font-heading text-base font-medium">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <span className="font-semibold text-foreground">{sentTo}</span>
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-otp" className="text-caption font-semibold text-foreground">
            Verification code
          </label>
          <Input
            id="login-otp"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
            placeholder="000000"
            className="text-center tracking-[0.4em] text-lg"
            aria-invalid={!!codeForm.formState.errors.code}
            {...codeForm.register('code')}
          />
          {codeForm.formState.errors.code && (
            <span className="ml-1 text-xs text-destructive">{codeForm.formState.errors.code.message}</span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <Warning className="size-3.5 shrink-0" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-[18px] text-sm font-semibold"
          disabled={busy || state.status === 'done'}
        >
          {busy ? (
            <CircleNotch className="size-4 animate-spin" />
          ) : state.status === 'done' ? (
            <><Check className="size-4" weight="bold" /> Verified</>
          ) : (
            <><Check className="size-4" weight="bold" /> Verify code</>
          )}
        </Button>

        <button
          type="button"
          onClick={() => { setPhase('email'); setError(null); codeForm.reset(); }}
          className="mx-auto flex cursor-pointer items-center gap-1.5 text-caption font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={emailForm.handleSubmit(handleSend)} noValidate className="space-y-4">
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
          aria-invalid={!!emailForm.formState.errors.email}
          {...emailForm.register('email')}
        />
        {emailForm.formState.errors.email && (
          <span className="ml-1 text-xs text-destructive">{emailForm.formState.errors.email.message}</span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <Warning className="size-3.5 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="h-12 w-full rounded-[18px] text-sm font-semibold"
        disabled={busy}
      >
        {busy ? (
          <CircleNotch className="size-4 animate-spin" />
        ) : (
          <Envelope className="size-4" />
        )}
        Send code
      </Button>

      <p className="text-center text-micro text-muted-foreground">
        New here? We&apos;ll create your account automatically.
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
