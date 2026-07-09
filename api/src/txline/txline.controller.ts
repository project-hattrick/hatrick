import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { TxlineSnapshotService } from './services/txline-snapshot.service';
import { TxlineReplayService } from './services/txline-replay.service';
import { FixtureDto } from './dto/fixture.dto';
import { FixtureScoreDto } from './dto/fixture-score.dto';
import { OddsSnapshotItemDto } from './dto/odds-snapshot.dto';
import { ScoreSnapshotItemDto } from './dto/score-snapshot.dto';
import { ReplayRequestDto } from './dto/replay-request.dto';

/** Public snapshot API — proxies TxLINE initial-state reads (docs/txline-provider.md). */
@ApiTags('TxLINE snapshots')
@Controller()
export class TxlineController {
  constructor(
    private readonly snapshots: TxlineSnapshotService,
    private readonly replay: TxlineReplayService,
  ) {}

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

  @Get('fixtures/:fixtureId/score')
  @ApiOperation({ summary: 'Authoritative current/final score for a fixture (baseline before the SSE stream).' })
  @ApiParam({ name: 'fixtureId', type: Number })
  @ApiOkResponse({ type: FixtureScoreDto })
  getFixtureScore(@Param('fixtureId', ParseIntPipe) fixtureId: number): Promise<FixtureScoreDto> {
    return this.snapshots.getFixtureScore(fixtureId);
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

  @Get('replay/catalog')
  @ApiOperation({ summary: 'List finished fixtures available to replay (discovered from historical updates).' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getReplayCatalog(@Query('days') days?: string) {
    return this.replay.catalog(days ? Number(days) : undefined);
  }

  @Get('replay/timeline')
  @ApiOperation({ summary: 'Full notable-event timeline of a past fixture for a front-driven, seekable replay.' })
  @ApiQuery({ name: 'fixtureId', type: Number })
  @ApiQuery({ name: 'epochDay', type: Number })
  @ApiQuery({ name: 'startHour', type: Number })
  @ApiQuery({ name: 'hours', required: false, type: Number })
  getReplayTimeline(
    @Query('fixtureId') fixtureId: string,
    @Query('epochDay') epochDay: string,
    @Query('startHour') startHour: string,
    @Query('hours') hours?: string,
  ) {
    return this.replay.timeline({
      fixtureId: Number(fixtureId),
      epochDay: Number(epochDay),
      startHour: Number(startHour),
      hours: hours ? Number(hours) : undefined,
    });
  }

  @Post('replay')
  @ApiOperation({ summary: 'Replay a past fixture from historical updates through the live event pipeline.' })
  startReplay(@Body() body: ReplayRequestDto): { started: boolean; fixtureId: number } {
    // Fire-and-forget: playback runs in the background and emits on the event bus.
    void this.replay.start(body);
    return { started: true, fixtureId: body.fixtureId };
  }

  @Post('replay/stop')
  @ApiOperation({ summary: 'Stop the currently running replay.' })
  stopReplay(): { stopped: boolean } {
    this.replay.stop();
    return { stopped: true };
  }

  @Get('replay/status')
  @ApiOperation({ summary: 'Whether a replay is currently playing.' })
  replayStatus(): { running: boolean } {
    return { running: this.replay.isRunning() };
  }
}
