'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Check, Cookie } from '@/components/common/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { localeLabels, locales, type Locale } from '@/i18n/locales';
import { localizePath } from '@/i18n/path';
import { useCookieNoticeStore } from '@/store/cookie-notice.store';
import { useNotificationsStore } from '@/store/notifications.store';

function SectionLabel({ children }: { children: string }) {
  return <span className="text-eyebrow text-muted-foreground">{children}</span>;
}

/** Preferences tab of the Settings dialog — language, in-app notifications and the cookie notice. */
export function SettingsPreferencesTab() {
  const { locale } = useI18n();
  const pathname = usePathname();
  const muted = useNotificationsStore((s) => s.muted);
  const setMuted = useNotificationsStore((s) => s.setMuted);
  const acknowledged = useCookieNoticeStore((s) => s.acknowledged);
  const resetCookieNotice = useCookieNoticeStore((s) => s.reset);

  const hrefFor = (nextLocale: Locale) => localizePath(pathname, nextLocale);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <SectionLabel>Language</SectionLabel>
        <div className="flex flex-col divide-y divide-border/40 rounded-xl border border-border/60 bg-surface-1/60">
          {locales.map((value) => (
            <Link
              key={value}
              href={hrefFor(value)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm transition hover:bg-surface-2/60"
            >
              <span className={`fi fi-${localeLabels[value].flag} rounded-sm`} />
              <span className="flex-1">{localeLabels[value].label}</span>
              {value === locale ? <Check className="size-4 text-neon" /> : null}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>Notifications</SectionLabel>
        <label className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-surface-1/60 px-3 py-2.5">
          <Bell className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex flex-1 flex-col">
            <span className="text-sm">In-app notifications</span>
            <span className="text-micro text-muted-foreground">
              Match, duel and pack alerts in the bell menu.
            </span>
          </span>
          <Switch checked={!muted} onCheckedChange={(checked) => setMuted(!checked)} />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>Privacy</SectionLabel>
        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-surface-1/60 px-3 py-2.5">
          <Cookie className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex flex-1 flex-col">
            <span className="text-sm">Cookie notice</span>
            <span className="text-micro text-muted-foreground">
              Essential cookies only — no tracking.{' '}
              <Link href="/legal/cookies" className="text-neon">
                Cookie Policy
              </Link>
            </span>
          </span>
          <Button size="sm" variant="ghost" disabled={!acknowledged} onClick={resetCookieNotice}>
            Show again
          </Button>
        </div>
      </div>
    </div>
  );
}
