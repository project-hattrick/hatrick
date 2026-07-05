import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { TxlineSnapshotService } from './services/txline-snapshot.service';
import { FixtureDto } from './dto/fixture.dto';
import { OddsSnapshotItemDto } from './dto/odds-snapshot.dto';
import { ScoreSnapshotItemDto } from './dto/score-snapshot.dto';

/** Public snapshot API — proxies TxLINE initial-state reads (docs/txline-provider.md). */
@ApiTags('TxLINE snapshots')
@Controller()
export class TxlineController {
  constructor(private readonly snapshots: TxlineSnapshotService) {}

  @Get('fixtures')
  @ApiOperation({ summary: 'Latest fixtures snapshot, optionally filtered by competition / epoch day.' })
  @ApiQuery({ name: 'competitionId', required: false, type: Number })
  @ApiQuery({ name: 'startEpochDay', required: false, type: Number })
  @ApiOkResponse({ type: FixtureDto, isArray: true })
  getFixtures(
    @Query('competitionId') competitionId?: string,
    @Query('startEpochDay') startEpochDay?: string,
  ): Promise<FixtureDto[]> {
    return this.snapshots.getFixtures({
      competitionId: competitionId ? Number(competitionId) : undefined,
      startEpochDay: startEpochDay ? Number(startEpochDay) : undefined,
    }) as Promise<FixtureDto[]>;
  }

  @Get('fixtures/:fixtureId/odds')
  @ApiOperation({ summary: 'Latest odds snapshot for a single fixture (baseline before the SSE stream).' })
  @ApiParam({ name: 'fixtureId', type: Number })
  @ApiOkResponse({ type: OddsSnapshotItemDto, isArray: true })
  getOdds(@Param('fixtureId', ParseIntPipe) fixtureId: number): Promise<OddsSnapshotItemDto[]> {
    return this.snapshots.getOddsSnapshot(fixtureId) as Promise<OddsSnapshotItemDto[]>;
  }

  @Get('fixtures/:fixtureId/scores')
  @ApiOperation({ summary: 'Latest score-event snapshot for a single fixture (baseline before the SSE stream).' })
  @ApiParam({ name: 'fixtureId', type: Number })
  @ApiOkResponse({ type: ScoreSnapshotItemDto, isArray: true })
  getScores(@Param('fixtureId', ParseIntPipe) fixtureId: number): Promise<ScoreSnapshotItemDto[]> {
    return this.snapshots.getScoresSnapshot(fixtureId) as Promise<ScoreSnapshotItemDto[]>;
  }
}
