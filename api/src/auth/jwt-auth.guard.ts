import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { AuthenticatedUser, JwtPayload } from './auth.types';
import { SESSION_COOKIE } from './session-cookie.util';

type AuthedRequest = Request & {
  user?: AuthenticatedUser;
  cookies?: Record<string, string>;
};

/**
 * Session-JWT guard — reads the token from the httpOnly cookie (browser path),
 * falling back to `Authorization: Bearer` for Swagger/non-browser clients, then
 * verifies it and attaches `request.user`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing session token');
    }
    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      request.user = { userId: payload.sub, walletAddress: payload.wallet };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: AuthedRequest): string | null {
    const cookieToken = request.cookies?.[SESSION_COOKIE];
    if (cookieToken) return cookieToken;
    const header = request.headers.authorization;
    return header?.startsWith('Bearer ') ? header.slice(7) : null;
  }
}
