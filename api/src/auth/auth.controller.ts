import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserResponseDto } from '../users/dto/user-response.dto';
import { UserRepository } from '../users/repositories';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { NonceResponseDto } from './dto/nonce-response.dto';
import { RequestNonceDto } from './dto/request-nonce.dto';
import { VerifySignatureDto } from './dto/verify-signature.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UserRepository,
  ) {}

  @Post('nonce')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a sign-in nonce',
    description: 'Returns a one-time message for the wallet to sign.',
  })
  @ApiOkResponse({ description: 'Nonce + message to sign', type: NonceResponseDto })
  requestNonce(@Body() dto: RequestNonceDto): NonceResponseDto {
    return this.auth.requestNonce(dto.walletAddress);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a signed nonce',
    description:
      'Verifies the signature, upserts the user (get-or-create), and returns a session JWT.',
  })
  @ApiOkResponse({ description: 'Session token + user', type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Nonce expired or signature invalid' })
  verify(@Body() dto: VerifySignatureDto): Promise<AuthResponseDto> {
    return this.auth.verify(dto.walletAddress, dto.signature);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current authenticated user' })
  @ApiOkResponse({ description: 'The signed-in user', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  async me(
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const user = await this.users.findById(principal.userId);
    if (!user) throw new UnauthorizedException('User no longer exists');
    return UserResponseDto.fromEntity(user);
  }
}
