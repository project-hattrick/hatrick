import { api } from './http';
import { endpoints } from './endpoints';
import type { NotificationType } from '@/enums/notification-type.enum';
import type { AppNotification } from '@/types/notification';

/** Notification row as the api returns it (GET /notifications). */
export interface ServerNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

/** api wire → bell menu shape. */
export function toAppNotification(n: ServerNotification): AppNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    ts: Date.parse(n.createdAt),
    read: n.read,
    href: n.href ?? undefined,
  };
}

/** Server-backed bell feed — rows are written by domain triggers, never by the client. */
export const notificationService = {
  list: (signal?: AbortSignal): Promise<ServerNotification[]> =>
    api.get<ServerNotification[]>(endpoints.notifications.base, signal),

  markAllRead: (): Promise<{ updated: number }> =>
    api.post<{ updated: number }>(endpoints.notifications.readAll),

  markRead: (id: string): Promise<ServerNotification> =>
    api.patch<ServerNotification>(endpoints.notifications.read(id)),
};
