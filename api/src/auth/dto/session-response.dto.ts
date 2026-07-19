import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '../../users/dto/user-response.dto';

export class SessionResponseDto {
  @ApiProperty({ description: 'The signed-in user', type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({
    description: 'Whether the user has an active on-chain delegation for server-side signing.',
    example: false,
  })
  hasDelegation!: boolean;

  @ApiProperty({
    description: 'ISO-8601 timestamp when the active delegation expires, or null.',
    example: null,
    nullable: true,
    type: String,
  })
  delegationExpiresAt!: string | null;
}
