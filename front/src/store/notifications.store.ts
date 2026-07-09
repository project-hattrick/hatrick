import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { NotificationType } from '@/enums/notification-type.enum';
import type { AppNotification } from '@/types/notification';

interface NotificationsStore {
  notifications: AppNotification[];
  /** When true, new pushes are dropped — the in-app notifications toggle in Settings. */
  muted: boolean;
  /** Push a new notification to the top (id/ts/read filled in). No-op while muted. */
  push: (notification: Omit<AppNotification, 'id' | 'ts' | 'read'>) => void;
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

/** Believable starter feed so the bell isn't empty on first load. */
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

/** In-app notification feed (mock). Persisted so read-state and pushes survive reloads. */
export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      notifications: seedNotifications(),
      muted: false,
      push: (notification) =>
        set((state) =>
          state.muted
            ? state
            : {
                notifications: [
                  { ...notification, id: crypto.randomUUID(), ts: Date.now(), read: false },
                  ...state.notifications,
                ].slice(0, 30),
              },
        ),
      markAllRead: () =>
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
      setMuted: (muted) => set({ muted }),
    }),
    {
      name: 'hat-trick-notifications',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
    },
  ),
);

export const useUnreadCount = () =>
  useNotificationsStore((state) => state.notifications.filter((n) => !n.read).length);
