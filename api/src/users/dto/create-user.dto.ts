import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Solana wallet address (base58, unique per user)',
    example: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    minLength: 32,
    maxLength: 44,
  })
  @IsString()
  @IsNotEmpty()
  @Length(32, 44)
  walletAddress!: string;

  @ApiPropertyOptional({
    description: 'Public display name shown on leaderboards',
    example: 'CryptoStriker9',
    maxLength: 32,
  })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  displayName?: string;
}
