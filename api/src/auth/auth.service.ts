import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserResponseDto } from '../users/dto/user-response.dto';
import { UserRepository } from '../users/repositories';
import { JwtPayload } from './auth.types';
import { AuthResponseDto } from './dto/auth-response.dto';
import { NonceResponseDto } from './dto/nonce-response.dto';
import { NonceStore } from './nonce.store';
import { verifyWalletSignature } from './signature.util';

/**
 * The exact human-readable message the wallet is asked to sign. Rebuilt verbatim
 * on verify — any drift between these two call sites breaks signature checks.
 */
export function buildSignInMessage(
  walletAddress: string,
  nonce: string,
): string {
  return `Sign in to Hat-trick.\n\nWallet: ${walletAddress}\nNonce: ${nonce}`;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly nonces: NonceStore,
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
  ) {}

  /** Step 1 — hand the wallet a fresh nonce wrapped in the message to sign. */
  requestNonce(walletAddress: string): NonceResponseDto {
    const nonce = this.nonces.issue(walletAddress);
    return { nonce, message: buildSignInMessage(walletAddress, nonce) };
  }

  /** Step 2 — verify the signature, upsert the user, and mint a session JWT. */
  async verify(
    walletAddress: string,
    signature: string,
  ): Promise<AuthResponseDto> {
    const nonce = this.nonces.consume(walletAddress);
    if (!nonce) {
      throw new UnauthorizedException(
        'Nonce missing or expired — request a new one',
      );
    }

    const message = buildSignInMessage(walletAddress, nonce);
    if (!verifyWalletSignature(message, signature, walletAddress)) {
      throw new UnauthorizedException('Signature does not match wallet');
    }

    const { user, isNew } = await this.users.upsertByWallet(walletAddress);
    const payload: JwtPayload = { sub: user.id, wallet: user.walletAddress };
    const token = await this.jwt.signAsync(payload);

    return { token, user: UserResponseDto.fromEntity(user), isNew };
  }
}
