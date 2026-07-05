'use client';

import Link from 'next/link';
import { Bell, type Icon } from '@/components/common/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { lookup } from '@/lib/lookup';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format';
import { notificationTypeConfig, notificationTypeFallback } from '@/config/notification-type.config';
import { toneConfig, toneFallback } from '@/config/tone.config';
import { useNotificationsStore, useUnreadCount } from '@/store/notifications.store';
import type { AppNotification } from '@/types/notification';

/** One notification row — icon chip, title/body, relative time, unread dot. */
function NotificationRow({ notification, now }: { notification: AppNotification; now: number }) {
  const meta = lookup(notificationTypeConfig, notification.type, notificationTypeFallback);
  const tone = lookup(toneConfig, meta.tone, toneFallback);
  const Glyph: Icon = meta.icon;

  const body = (
    <div className="flex items-start gap-3 rounded-xl px-2.5 py-2 transition hover:bg-white/[0.06]">
      <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-full', tone.soft)}>
        <Glyph className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="truncate">{notification.title}</span>
          {!notification.read && <span className="size-1.5 shrink-0 rounded-full bg-neon" />}
        </span>
        <span className="truncate text-xs text-muted-foreground">{notification.body}</span>
        <span className="mt-0.5 text-[10px] text-muted-foreground/70">{formatRelativeTime(notification.ts, now)}</span>
      </div>
    </div>
  );

  return notification.href ? <Link href={notification.href}>{body}</Link> : body;
}

/** Navbar bell — mocked notification feed with an unread badge + mark-all-read. */
export function NotificationsMenu() {
  const notifications = useNotificationsStore((s) => s.notifications);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const unread = useUnreadCount();
  const now = Date.now();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full border-2 border-background bg-live px-1 text-[9px] font-bold text-white tabular-nums">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
          <span className="text-sm font-bold">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="cursor-pointer text-[11px] font-semibold text-neon hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="custom-scrollbar flex max-h-96 flex-col gap-0.5 overflow-y-auto p-1.5">
          {notifications.length ? (
            notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} now={now} />
            ))
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
