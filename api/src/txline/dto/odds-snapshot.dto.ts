import { ApiProperty } from '@nestjs/swagger';

/** One bookmaker market in a fixture's latest-odds snapshot. */
export class OddsSnapshotItemDto {
  @ApiProperty() FixtureId!: number;
  @ApiProperty() MessageId!: string;
  @ApiProperty({ description: 'Update timestamp, epoch ms.' }) Ts!: number;
  @ApiProperty() Bookmaker!: string;
  @ApiProperty() BookmakerId!: number;
  @ApiProperty({ description: 'Market family, e.g. 1X2 / OverUnder.' }) SuperOddsType!: string;
  @ApiProperty({ description: 'In-play (true) vs pre-match (false).' }) InRunning!: boolean;
  @ApiProperty({ required: false, description: 'H1 / HT / H2 / Total.' }) MarketPeriod?: string;
  @ApiProperty({ required: false, type: [String] }) PriceNames?: string[];
  @ApiProperty({ required: false, type: [Number] }) Prices?: number[];
  @ApiProperty({ required: false, type: [String] }) Pct?: string[];
}
