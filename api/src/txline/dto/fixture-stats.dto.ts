import { ApiProperty } from '@nestjs/swagger';

/** One home/away counter pair. */
export class StatTallyDto {
  @ApiProperty() home!: number;
  @ApiProperty() away!: number;
}

/**
 * Authoritative team stats for a fixture, tallied from the FULL scores snapshot. Only stats TxLINE
 * carries as countable events are included — possession % and passes are not provided by the feed.
 */
export class FixtureStatsDto {
  @ApiProperty() fixtureId!: number;
  @ApiProperty({ type: StatTallyDto }) shots!: StatTallyDto;
  @ApiProperty({ type: StatTallyDto }) shotsOnTarget!: StatTallyDto;
  @ApiProperty({ type: StatTallyDto }) fouls!: StatTallyDto;
  @ApiProperty({ type: StatTallyDto }) corners!: StatTallyDto;
  @ApiProperty({ type: StatTallyDto }) yellowCards!: StatTallyDto;
  @ApiProperty({ type: StatTallyDto }) redCards!: StatTallyDto;
  @ApiProperty({ type: StatTallyDto }) offsides!: StatTallyDto;
  @ApiProperty({ required: false, description: 'Latest clock minute seen, if any.' }) minute?: number;
  @ApiProperty({ description: 'True once a game_finalised / full-time event is present.' }) finished!: boolean;
}
