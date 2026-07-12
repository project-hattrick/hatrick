import { ApiProperty } from '@nestjs/swagger';

/** A notable thing that happened in a fixture (goal, card, corner…). */
export class FixtureActionDto {
  @ApiProperty({ description: 'Raw wire action, e.g. goal, yellow_card, corner.' }) action!: string;
  @ApiProperty({ required: false }) minute?: number;
  @ApiProperty({ required: false, description: '1 = home, 2 = away.' }) participant?: number;
}

/** Authoritative current/final score for a fixture, reduced from the scores snapshot. */
export class FixtureScoreDto {
  @ApiProperty() fixtureId!: number;
  @ApiProperty({ description: 'Home goals from Score.Participant1.Total.Goals (includes extra time).' }) home!: number;
  @ApiProperty({ description: 'Away goals from Score.Participant2.Total.Goals (includes extra time).' }) away!: number;
  @ApiProperty({ required: false, description: 'Regulation-time (H1+H2) home goals — standard 1X2/OU settlement basis.' })
  regulationHome?: number;
  @ApiProperty({ required: false, description: 'Regulation-time (H1+H2) away goals — standard 1X2/OU settlement basis.' })
  regulationAway?: number;
  @ApiProperty({ required: false, description: 'Latest clock minute seen, if any.' }) minute?: number;
  @ApiProperty({ description: 'True once a game_finalised / full-time event is present.' }) finished!: boolean;
  @ApiProperty({ description: 'False when the snapshot carried no Score object (unknown, treat as 0-0).' })
  hasScore!: boolean;
  @ApiProperty({ type: FixtureActionDto, isArray: true, description: 'Notable events for the recap feed.' })
  actions!: FixtureActionDto[];
}
