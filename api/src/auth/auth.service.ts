import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountType, WalletTxType, type User } from '@prisma/client';
import { PrivyClient } from '@privy-io/server-auth';

import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { WELCOME_GRANT_COINS } from '../users/user.constants';
import { UserRepository, WalletRepository } from '../users/repositories';
import { JwtPayload } from './auth.types';
import { AuthResponseDto } from './dto/auth-response.dto';
import { NonceResponseDto } from './dto/nonce-response.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { NonceStore } from './nonce.store';
import {
  hashPassword,
  syntheticWalletAddress,
  verifyPassword,
} from './password.util';
import { verifyWalletSignature } from './signature.util';
import { PRIVY_CLIENT } from './privy.provider';

/**
 * The exact human-readable message the wallet is asked to sign. Rebuilt verbatim
 * on verify — any drift between these two call sites breaks signature checks.
 */
export function buildSignInMessage(
  walletAddress: string,
  nonce: string,
): string {
  return `Sign in to Hatrick.\n\nWallet: ${walletAddress}\nNonce: ${nonce}`;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly nonces: NonceStore,
    private readonly users: UserRepository,
    private readonly wallet: WalletRepository,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    @Inject(PRIVY_CLIENT) private readonly privy: PrivyClient,
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

  // ─── Privy-token login ──────────────────────────────────────────────────────

  /**
   * Verify a Privy access token, resolve (or create) the user, and return a
   * session cookie + the session envelope the frontend expects.
   *
   * Wallet resolution order (mirrors the duo backend):
   *   1. Embedded Privy Solana wallet (`walletClientType === 'privy'`)
   *   2. Any linked Solana wallet
   *   3. Any linked wallet (non-Solana fallback)
   *   4. Poll Privy getUser() up to 4×500 ms (embedded wallet may lag token issuance)
   *   5. Synthetic off-chain address (`offchain:<privyDid>`) so login never blocks
   */
  async loginWithPrivy(privyToken: string): Promise<{
    token: string;
    user: UserResponseDto;
    isNew: boolean;
    hasDelegation: boolean;
    delegationExpiresAt: string | null;
  }> {
    let claims: Awaited<ReturnType<PrivyClient['verifyAuthToken']>>;
    try {
      claims = await this.privy.verifyAuthToken(privyToken);
    } catch {
      throw new UnauthorizedException('Invalid Privy token');
    }

    const privyDid = claims.userId;
    const linkedAccounts = (
      ((claims as any).linkedAccounts ?? (claims as any).linked_accounts ?? []) as any[]
    );

    const walletAddress = await this.resolvePrivyWallet(privyDid, linkedAccounts);
    this.logger.log(`[privy-login] did=${privyDid} wallet=${walletAddress}`);

    // Upsert keyed on privyDid; fall back to walletAddress to merge legacy rows.
    let user: User | null = await this.prisma.user.findUnique({ where: { privyDid } });

    if (!user) {
      // Check if the resolved wallet already has a row (legacy wallet-sign-in).
      const byWallet = await this.prisma.user.findUnique({ where: { walletAddress } });
      if (byWallet) {
        user = await this.prisma.user.update({
          where: { id: byWallet.id },
          data: { privyDid, lastLoginAt: new Date() },
        });
      }
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { walletAddress, lastLoginAt: new Date() },
      });
    }

    const isNew = !user;
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          privyDid,
          walletAddress,
          accountType: AccountType.Competitor,
          balance: WELCOME_GRANT_COINS,
          lastLoginAt: new Date(),
        },
      });
      await this.wallet.record({
        user: { connect: { id: user.id } },
        type: WalletTxType.WelcomeGrant,
        amount: user.balance,
        balanceAfter: user.balance,
      });
    }

    const payload: JwtPayload = { sub: user.id, wallet: user.walletAddress };
    const token = await this.jwt.signAsync(payload);

    return {
      token,
      user: UserResponseDto.fromEntity(user),
      isNew,
      hasDelegation: false,
      delegationExpiresAt: null,
    };
  }

  /**
   * Return the session envelope for an already-authenticated user (for GET /auth/session).
   * Mirrors the duo backend's `getSession` — no delegation table exists in this api yet,
   * so hasDelegation is always false.
   */
  async getSessionForUser(userId: string): Promise<SessionResponseDto> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User no longer exists');
    const dto = new SessionResponseDto();
    dto.user = UserResponseDto.fromEntity(user);
    dto.hasDelegation = false;
    dto.delegationExpiresAt = null;
    return dto;
  }

  // ─── Wallet resolution (Privy) ─────────────────────────────────────────────

  private async resolvePrivyWallet(
    privyDid: string,
    linkedAccounts: any[],
  ): Promise<string> {
    const pickWallet = (accounts: any[]): string | undefined =>
      (
        accounts.find(
          (a: any) =>
            a.type === 'wallet' &&
            a.chainType === 'solana' &&
            a.walletClientType === 'privy',
        ) ??
        accounts.find((a: any) => a.type === 'wallet' && a.chainType === 'solana') ??
        accounts.find((a: any) => a.type === 'wallet')
      )?.address;

    let address = pickWallet(linkedAccounts);

    // Poll up to 4×500 ms — embedded wallet may not appear in the token claims
    // if Privy minted it fractionally after the token was issued.
    for (let i = 0; !address && i < 4; i++) {
      try {
        const privyUser = await this.privy.getUser(privyDid);
        address = pickWallet(privyUser.linkedAccounts ?? []);
        this.logger.log(
          `[resolvePrivyWallet] poll ${i + 1}/4 getUser → wallet=${address ?? 'none'}`,
        );
      } catch (err) {
        this.logger.warn(
          `[resolvePrivyWallet] poll ${i + 1}/4 getUser FAILED: ${(err as Error).message}`,
        );
      }
      if (!address) await new Promise((r) => setTimeout(r, 500));
    }

    if (address) return address;

    // Last resort: synthetic address so login never blocks (off-chain USDC ledger).
    const synthetic = `offchain:${privyDid}`;
    this.logger.warn(
      `[resolvePrivyWallet] no wallet found for ${privyDid} — using synthetic ${synthetic}`,
    );
    return synthetic;
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  private async mintSession(
    user: User,
    isNew: boolean,
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, wallet: user.walletAddress };
    const token = await this.jwt.signAsync(payload);
    return { token, user: UserResponseDto.fromEntity(user), isNew };
  }
}
