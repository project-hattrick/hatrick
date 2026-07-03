import { ApiProperty } from '@nestjs/swagger';

export class NonceResponseDto {
  @ApiProperty({
    description: 'One-time random nonce (hex)',
    example: 'a3f1c0...9e',
  })
  nonce!: string;

  @ApiProperty({
    description: 'The exact message the wallet must sign',
    example: 'Sign in to Hat-trick.\n\nWallet: 7xKX...\nNonce: a3f1c0...9e',
  })
  message!: string;
}
