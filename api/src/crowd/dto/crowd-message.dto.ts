import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length } from 'class-validator';

export class SendCrowdMessageDto {
  @ApiProperty({ description: 'Fan message text', maxLength: 200 })
  @IsString()
  @Length(1, 200)
  text!: string;

  @ApiPropertyOptional({ description: 'Fixture the viewer is watching' })
  @IsInt()
  @IsOptional()
  fixtureId?: number;
}

/** Payload broadcast to every socket when a message becomes a balloon. */
export class CrowdMessageBroadcastDto {
  @ApiProperty({ description: 'Ephemeral message id' })
  id!: string;

  @ApiProperty({ description: 'Sender user id — clients skip their own echo' })
  userId!: string;

  @ApiProperty({ description: 'Public author label' })
  author!: string;

  @ApiProperty({ description: 'Sender country code', nullable: true, type: String })
  country!: string | null;

  @ApiProperty({ description: 'Sanitized message text' })
  text!: string;

  @ApiProperty({ description: 'Fixture context', nullable: true, type: Number })
  fixtureId!: number | null;

  @ApiProperty({ description: 'Server timestamp (epoch ms)' })
  ts!: number;
}
