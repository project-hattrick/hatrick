import { ForbiddenException } from '@nestjs/common';

import type { AuthenticatedUser } from './auth.types';

/**
 * Authorization rule for wallet-scoped actions: the target wallet must be the
 * signed-in user's own wallet. Centralized so every protected route enforces it
 * identically. Throws 403 on mismatch.
 */
export function assertWalletOwner(
  user: AuthenticatedUser,
  walletAddress: string,
): void {
  if (walletAddress !== user.walletAddress) {
    throw new ForbiddenException(
      'walletAddress must match the signed-in wallet',
    );
  }
}

/**
 * Authorization rule for id-scoped actions: the target user id must be the
 * signed-in user's own id. Used to guard profile update/delete. Throws 403.
 */
export function assertSelf(user: AuthenticatedUser, userId: string): void {
  if (userId !== user.userId) {
    throw new ForbiddenException('You can only modify your own account');
  }
}
