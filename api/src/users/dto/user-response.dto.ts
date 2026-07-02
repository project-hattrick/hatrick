import { ApiProperty } from '@nestjs/swagger';
import type { User } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    description: 'User id (cuid)',
    example: 'cmcg1x2ab0000v8lk3f9d7h2q',
  })
  id!: string;

  @ApiProperty({
    description: 'Solana wallet address',
    example: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  })
  walletAddress!: string;

  @ApiProperty({
    description: 'Public display name',
    example: 'CryptoStriker9',
    nullable: true,
    type: String,
  })
  displayName!: string | null;

  @ApiProperty({
    description: 'Play-money balance as a decimal string',
    example: '1000.00',
  })
  balance!: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-07-02T12:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-07-02T12:00:00.000Z',
  })
  updatedAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.walletAddress = user.walletAddress;
    dto.displayName = user.displayName;
    dto.balance = user.balance.toFixed(2);
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
