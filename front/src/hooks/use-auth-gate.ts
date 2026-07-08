'use client';

import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';

/**
 * Auth gate for action buttons. Returns a wrapper: `gate(action)` yields a click
 * handler that runs `action` when signed in, or opens the login dialog when not.
 * Use for every "start a duel" CTA so an anonymous user is prompted to sign in first.
 */
export function useAuthGate() {
  const authed = useAuthStore((s) => s.status === 'authed');
  const openLogin = useUiStore((s) => s.openLogin);
  return (action: () => void) => () => {
    if (authed) action();
    else openLogin();
  };
}
