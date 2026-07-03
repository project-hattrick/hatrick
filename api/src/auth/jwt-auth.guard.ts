import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { AuthenticatedUser, JwtPayload } from './auth.types';

/** Bearer-JWT guard — verifies the token and attaches `request.user`. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    try {
      const payload = this.jwt.verify<JwtPayload>(header.slice(7));
      request.user = { userId: payload.sub, walletAddress: payload.wallet };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
