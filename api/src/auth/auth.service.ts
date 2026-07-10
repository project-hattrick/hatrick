import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WalletTxType, type User } from '@prisma/client';

import { UserResponseDto } from '../users/dto/user-response.dto';
import { UserRepository, WalletRepository } from '../users/repositories';
import { JwtPayload } from './auth.types';
import { AuthResponseDto } from './dto/auth-response.dto';
import { NonceResponseDto } from './dto/nonce-response.dto';
import { NonceStore } from './nonce.store';
import {
  hashPassword,
  syntheticWalletAddress,
  verifyPassword,
} from './password.util';
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
    private readonly wallet: WalletRepository,
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
    // Provenance for the starting balance — the first entry in the user's ledger.
    if (isNew) {
      await this.wallet.record({
        user: { connect: { id: user.id } },
        type: WalletTxType.WelcomeGrant,
        amount: user.balance,
        balanceAfter: user.balance,
      });
    }
    return this.mintSession(user, isNew);
  }

  /**
   * Email sign-in-or-register (Collector tier). New email → create a Collector
   * with a synthetic wallet address; existing email → verify the password.
   */
  async signInWithEmail(
    email: string,
    password: string,
  ): Promise<AuthResponseDto> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      if (
        !existing.passwordHash ||
        !(await verifyPassword(password, existing.passwordHash))
      ) {
        throw new UnauthorizedException('Wrong password for this email');
      }
      // Off the critical path — lastLoginAt staleness is harmless.
      this.users.touchLastLogin(existing.id).catch(() => {});
      return this.mintSession(existing, false);
    }

    const user = await this.users.createCollector(
      email,
      await hashPassword(password),
      syntheticWalletAddress(),
    );
    await this.wallet.record({
      user: { connect: { id: user.id } },
      type: WalletTxType.WelcomeGrant,
      amount: user.balance,
      balanceAfter: user.balance,
    });
    return this.mintSession(user, true);
  }

  private async mintSession(
    user: User,
    isNew: boolean,
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, wallet: user.walletAddress };
    const token = await this.jwt.signAsync(payload);
    return { token, user: UserResponseDto.fromEntity(user), isNew };
  }
}
