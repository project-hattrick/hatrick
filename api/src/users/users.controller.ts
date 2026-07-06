import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { assertSelf } from '../auth/wallet-owner.util';
import {
  ApiPaginatedResponse,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../common/dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Registration is handled by POST /auth/verify (get-or-create on sign-in), so
  // there is no public POST /users — it would let anyone mint accounts unsigned.

  @Get()
  @ApiOperation({
    summary: 'List users (paginated)',
    description: 'Newest first. Use `page` and `limit` query params.',
  })
  @ApiPaginatedResponse(UserResponseDto)
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({
    name: 'id',
    description: 'User id (cuid)',
    example: 'cmcg1x2ab0000v8lk3f9d7h2q',
  })
  @ApiOkResponse({ description: 'The user', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update your account',
    description: 'Partial update — send only the fields to change. Self only.',
  })
  @ApiParam({ name: 'id', description: 'User id (cuid)' })
  @ApiOkResponse({ description: 'Updated user', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Not your account' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'walletAddress already registered' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    assertSelf(principal, id);
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete your account', description: 'Self only.' })
  @ApiParam({ name: 'id', description: 'User id (cuid)' })
  @ApiNoContentResponse({ description: 'User deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Not your account' })
  @ApiNotFoundResponse({ description: 'User not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<void> {
    assertSelf(principal, id);
    return this.usersService.remove(id);
  }
}
