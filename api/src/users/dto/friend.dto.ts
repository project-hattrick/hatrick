import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

import { UserResponseDto } from './user-response.dto';

export class FriendRequestDto {
  @ApiProperty({ description: 'User id (cuid) to befriend' })
  @IsString()
  userId!: string;
}

export class RespondFriendDto {
  @ApiProperty({ description: 'User id (cuid) whose pending request this answers' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'true → accept, false → decline' })
  @IsBoolean()
  accept!: boolean;
}

/** The whole friend graph as the signed-in user sees it — each list holds the OTHER party. */
export class FriendsSnapshotDto {
  @ApiProperty({ description: 'Confirmed friends', type: [UserResponseDto] })
  friends!: UserResponseDto[];

  @ApiProperty({ description: 'Pending requests sent to you', type: [UserResponseDto] })
  incoming!: UserResponseDto[];

  @ApiProperty({ description: 'Pending requests you sent', type: [UserResponseDto] })
  outgoing!: UserResponseDto[];
}
