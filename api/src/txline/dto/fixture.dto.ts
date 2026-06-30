import { ApiProperty } from '@nestjs/swagger';

/** A TxLINE fixture (mirrors the provider snapshot shape). */
export class FixtureDto {
  @ApiProperty() FixtureId!: number;
  @ApiProperty({ description: 'Kickoff, epoch ms.' }) StartTime!: number;
  @ApiProperty({ description: 'Update timestamp, epoch ms.' }) Ts!: number;
  @ApiProperty() Competition!: string;
  @ApiProperty() CompetitionId!: number;
  @ApiProperty({ required: false }) FixtureGroupId?: number;
  @ApiProperty() Participant1Id!: number;
  @ApiProperty() Participant1!: string;
  @ApiProperty() Participant2Id!: number;
  @ApiProperty() Participant2!: string;
  @ApiProperty() Participant1IsHome!: boolean;
}
