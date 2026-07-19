import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { NonceStore } from './nonce.store';
import { privyClientProvider } from './privy.provider';

@Module({
  imports: [
    ConfigModule, // ensures ConfigService is available for privyClientProvider
    forwardRef(() => UsersModule), // provides UserRepository (cycle: UsersModule uses JwtAuthGuard)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_SECRET') ?? 'dev-insecure-secret-change-me',
        signOptions: {
          // ms-style duration string (e.g. "7d"); cast because @nestjs/jwt narrows
          // expiresIn to a template-literal type plain config strings don't match.
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            '7d') as unknown as number,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, NonceStore, JwtAuthGuard, privyClientProvider],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
