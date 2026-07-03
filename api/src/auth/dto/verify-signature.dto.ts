import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifySignatureDto {
  @ApiProperty({
    description: 'Solana wallet address (base58)',
    example: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    minLength: 32,
    maxLength: 44,
  })
  @IsString()
  @IsNotEmpty()
  @Length(32, 44)
  walletAddress!: string;

  @ApiProperty({
    description: 'ed25519 signature of the nonce message, base64-encoded',
    example: 'Xy9k...==',
  })
  @IsString()
  @IsNotEmpty()
  signature!: string;
}
