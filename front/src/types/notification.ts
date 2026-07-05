import type { NotificationType } from '@/enums/notification-type.enum';

/** An in-app notification shown in the navbar bell menu. */
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ms epoch when it fired. */
  ts: number;
  read: boolean;
  /** Optional deep link opened on click. */
  href?: string;
}
