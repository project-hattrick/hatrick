import { Ticket, UserPlus, Broadcast, Package, Bell, type Icon } from '@/components/common/icons';
import { NotificationType } from '@/enums/notification-type.enum';
import { Tone } from '@/enums/tone.enum';

interface NotificationTypeMeta {
  icon: Icon;
  tone: Tone;
}

/** Icon + accent per notification category — typed lookup, no switch. */
export const notificationTypeConfig: Record<NotificationType, NotificationTypeMeta> = {
  [NotificationType.Bet]: { icon: Ticket, tone: Tone.Positive },
  [NotificationType.Friend]: { icon: UserPlus, tone: Tone.Info },
  [NotificationType.Match]: { icon: Broadcast, tone: Tone.Danger },
  [NotificationType.Pack]: { icon: Package, tone: Tone.Warning },
  [NotificationType.System]: { icon: Bell, tone: Tone.Neutral },
};

export const notificationTypeFallback: NotificationTypeMeta = { icon: Bell, tone: Tone.Neutral };
