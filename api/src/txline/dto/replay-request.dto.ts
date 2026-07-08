import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

/** Body for POST /replay — start a historical replay of one fixture. */
export class ReplayRequestDto {
  @ApiProperty({ description: 'Fixture to replay.' })
  @IsInt()
  @IsPositive()
  fixtureId!: number;

  @ApiProperty({ description: 'Epoch day the match started: floor(startMs / 86_400_000).' })
  @IsInt()
  @IsPositive()
  epochDay!: number;

  @ApiProperty({ description: 'UTC hour of kickoff (0-23).' })
  @IsInt()
  @Min(0)
  @Max(23)
  startHour!: number;

  @ApiProperty({ required: false, description: 'Hours to scan from kickoff (default 3).' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  hours?: number;

  @ApiProperty({ required: false, description: 'Playback speed multiplier — real gaps ÷ speed (default 8).' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  speed?: number;
}
