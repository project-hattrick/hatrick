import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, type Notification } from '@prisma/client';

export class NotificationDto {
  @ApiProperty({ description: 'Notification id (cuid)' })
  id!: string;

  @ApiProperty({ description: 'Domain the alert belongs to', enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ description: 'Short headline', example: 'Bet won' })
  title!: string;

  @ApiProperty({ description: 'One-line detail', example: 'MatchResult home · +250 coins' })
  body!: string;

  @ApiProperty({ description: 'In-app destination', nullable: true, type: String })
  href!: string | null;

  @ApiProperty({ description: 'Whether the user has seen it' })
  read!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  static fromEntity(notification: Notification): NotificationDto {
    const dto = new NotificationDto();
    dto.id = notification.id;
    dto.type = notification.type;
    dto.title = notification.title;
    dto.body = notification.body;
    dto.href = notification.href;
    dto.read = notification.read;
    dto.createdAt = notification.createdAt;
    return dto;
  }
}
