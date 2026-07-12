import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';

import { EventName } from '../events/enums';
import { NotificationRepository } from './repositories';
import { UserGateway } from './user.gateway';
import { NotificationDto } from './dto/notification.dto';

/** What a domain trigger provides — id/read/createdAt are filled in on persist. */
export interface NotifyInput {
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
}

/**
 * Single seam for user alerts: every domain trigger (bet settled, friend request,
 * duel finished, store purchase) calls `notify()`, which persists the row and
 * pushes it to the user's socket channel in one motion.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notifications: NotificationRepository,
    private readonly gateway: UserGateway,
  ) {}

  async notify(userId: string, input: NotifyInput): Promise<NotificationDto> {
    const row = await this.notifications.create({
      user: { connect: { id: userId } },
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    });
    const dto = NotificationDto.fromEntity(row);
    this.gateway.emitNotification(userId, dto);
    return dto;
  }

  async list(userId: string): Promise<NotificationDto[]> {
    const rows = await this.notifications.findByUser(userId);
    return rows.map((row) => NotificationDto.fromEntity(row));
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notifications.markAllRead(userId);
    return { updated: result.count };
  }

  async markRead(userId: string, id: string): Promise<NotificationDto> {
    const target = await this.notifications.findById(id);
    if (!target) throw new NotFoundException('Notification not found');
    if (target.userId !== userId) throw new ForbiddenException('Not your notification');
    return NotificationDto.fromEntity(await this.notifications.markRead(id));
  }

  /** Store purchases confirm asynchronously via the bus — surface them in the bell. */
  @OnEvent(EventName.StorePurchaseAfter)
  async onStorePurchase(payload: { userId: string; slug: string; price: number }): Promise<void> {
    try {
      await this.notify(payload.userId, {
        type: NotificationType.System,
        title: 'Purchase confirmed',
        body: `${payload.slug} · ${payload.price} coins`,
        href: '/store',
      });
    } catch (error) {
      this.logger.warn(`store-purchase notification failed: ${(error as Error).message}`);
    }
  }
}
