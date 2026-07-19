import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PrivyLoginDto {
  @ApiProperty({
    description: 'Short-lived Privy access token obtained from the Privy SDK on the client.',
    example: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  privyToken!: string;
}
