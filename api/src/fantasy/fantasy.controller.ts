import { Body, Controller, Get, HttpCode, HttpStatus, Put, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CardDto } from './dto/card.dto';
import { OpenPackDto, PackResultDto } from './dto/open-pack.dto';
import { SaveSquadDto, SquadDto } from './dto/save-squad.dto';
import { CardRepository } from './repositories';
import { PackService, SquadService } from './services';

/** Cards catalog + the signed-in user's collection, packs and active XI. */
@ApiTags('Fantasy')
@Controller('fantasy')
export class FantasyController {
  constructor(
    private readonly cards: CardRepository,
    private readonly packs: PackService,
    private readonly squads: SquadService,
  ) {}

  @Get('cards')
  @ApiOperation({ summary: 'The full card catalog (public)' })
  @ApiOkResponse({ description: 'All catalog cards', type: [CardDto] })
  async catalog(): Promise<CardDto[]> {
    const rows = await this.cards.findAll();
    return rows.map((card) => CardDto.fromCatalog(card));
  }

  @Get('collection')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Your owned cards' })
  @ApiOkResponse({ description: 'Owned cards', type: [CardDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  collection(@CurrentUser() principal: AuthenticatedUser): Promise<CardDto[]> {
    return this.packs.collection(principal.userId);
  }

  @Post('packs/open')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Open a pack (server draw + ledger)' })
  @ApiOkResponse({ description: 'Drawn cards + new balance', type: PackResultDto })
  openPack(
    @Body() dto: OpenPackDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<PackResultDto> {
    return this.packs.open(principal.userId, dto.type);
  }

  @Get('squad')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Your active XI' })
  @ApiOkResponse({ description: 'Active squad or null', type: SquadDto })
  getSquad(@CurrentUser() principal: AuthenticatedUser): Promise<SquadDto | null> {
    return this.squads.getActive(principal.userId);
  }

  @Put('squad')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save your active XI' })
  @ApiOkResponse({ description: 'Saved squad', type: SquadDto })
  saveSquad(
    @Body() dto: SaveSquadDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<SquadDto> {
    return this.squads.saveActive(principal.userId, dto);
  }
}
