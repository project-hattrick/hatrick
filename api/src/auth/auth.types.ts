/** Shape signed into the JWT and re-hydrated onto the request by JwtAuthGuard. */
export interface JwtPayload {
  sub: string; // user id (cuid)
  wallet: string; // Solana wallet address (base58)
  iat?: number;
  exp?: number;
}

/** The authenticated principal attached to `request.user` after the guard runs. */
export interface AuthenticatedUser {
  userId: string;
  walletAddress: string;
}
