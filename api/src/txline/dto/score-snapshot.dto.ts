import { ApiProperty } from '@nestjs/swagger';

/** One action in a fixture's latest score-event snapshot. */
export class ScoreSnapshotItemDto {
  @ApiProperty() fixtureId!: number;
  @ApiProperty({ description: 'Event timestamp, epoch ms.' }) ts!: number;
  @ApiProperty({ description: 'Monotonic sequence id for this fixture.' }) seq!: number;
  @ApiProperty({ description: 'false → DURING (optimistic) · true → AFTER (authoritative).' })
  confirmed!: boolean;
  @ApiProperty({ required: false }) gameState?: string;
  @ApiProperty({ required: false }) action?: string;
  @ApiProperty({ required: false, type: Object, description: 'Per-action detail: PlayerId, Minutes, Goal, cards, VAR…' })
  dataSoccer?: Record<string, unknown>;
  @ApiProperty({ required: false, type: Object, description: 'Period-split score counts per participant.' })
  scoreSoccer?: Record<string, unknown>;
  @ApiProperty({ required: false }) possession?: number;
  @ApiProperty({ required: false, description: 'Attack | Danger | HighDanger | Safe.' })
  possessionType?: string;
}
