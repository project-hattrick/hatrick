import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { NotificationType } from '@/enums/notification-type.enum';
import { env } from '@/lib/env';
import { notificationService } from '@/services/notification.service';
import { isBackendSession } from '@/services/session-mode';
import type { AppNotification } from '@/types/notification';

interface NotificationsStore {
  notifications: AppNotification[];
  /** When true, new pushes are dropped — the in-app notifications toggle in Settings. */
  muted: boolean;
  /** Push a new notification to the top (id/ts/read filled in). No-op while muted. */
  push: (notification: Omit<AppNotification, 'id' | 'ts' | 'read'>) => void;
  /** Insert a server-pushed notification (already has id/ts/read). No-op while muted. */
  pushServer: (notification: AppNotification) => void;
  /** Wholesale replace from the server feed (boot hydration — server is source of truth). */
  hydrate: (notifications: AppNotification[]) => void;
  /** Mark every notification as read (called when the bell menu opens). */
  markAllRead: () => void;
  setMuted: (muted: boolean) => void;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const MINUTE = 60_000;
const MAX_NOTIFICATIONS = 30;

/** Believable starter feed so the bell isn't empty on first load — MOCK MODE ONLY. */
function seedNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: 'seed-match',
      type: NotificationType.Match,
      title: 'Argentina vs France is live',
      body: 'Kick-off just happened — watch and bet now.',
      ts: now - 3 * MINUTE,
      read: false,
      href: '/',
    },
    {
      id: 'seed-friend',
      type: NotificationType.Friend,
      title: 'New duel challenge',
      body: 'bleuforce wants to face your XI.',
      ts: now - 22 * MINUTE,
      read: false,
      href: '/duelists',
    },
    {
      id: 'seed-pack',
      type: NotificationType.Pack,
      title: 'Daily pack ready',
      body: 'Your free pack is waiting in the store.',
      ts: now - 90 * MINUTE,
      read: true,
      href: '/store',
    },
  ];
}

/**
 * In-app notification feed. Mock mode: seeded + fully local (persisted). Backend
 * mode: hydrated from GET /notifications and pushed to via the user socket channel —
 * only the mute preference persists locally (the server owns the list).
 */
export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      notifications: env.useMock ? seedNotifications() : [],
      muted: false,
      push: (notification) =>
        set((state) =>
          state.muted
            ? state
            : {
                notifications: [
                  { ...notification, id: crypto.randomUUID(), ts: Date.now(), read: false },
                  ...state.notifications,
                ].slice(0, MAX_NOTIFICATIONS),
              },
        ),
      pushServer: (notification) =>
        set((state) =>
          state.muted || state.notifications.some((n) => n.id === notification.id)
            ? state
            : {
                notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
              },
        ),
      hydrate: (notifications) => set({ notifications }),
      markAllRead: () => {
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
        // Mirror to the server ledger; local state already reflects the intent.
        if (isBackendSession()) notificationService.markAllRead().catch(() => {});
      },
      setMuted: (muted) => set({ muted }),
    }),
    {
      name: 'hat-trick-notifications',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
      // Backend mode: the server owns the feed — persist only the mute preference.
      partialize: (state) =>
        env.useMock
          ? { notifications: state.notifications, muted: state.muted }
          : ({ muted: state.muted } as Partial<NotificationsStore>),
    },
  ),
);

export const useUnreadCount = () =>
  useNotificationsStore((state) => state.notifications.filter((n) => !n.read).length);
