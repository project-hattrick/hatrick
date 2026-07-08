'use client';

import { LoginDialog } from '@/components/common/login-dialog';
import { useUiStore } from '@/store/ui.store';

/** The single app-wide sign-in dialog, driven by ui.store so any gated CTA can open it. */
export function LoginMount() {
  const open = useUiStore((s) => s.loginOpen);
  const setLoginOpen = useUiStore((s) => s.setLoginOpen);
  return <LoginDialog open={open} onOpenChange={setLoginOpen} />;
}
