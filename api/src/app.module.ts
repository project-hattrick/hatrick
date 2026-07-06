import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TxlineModule } from './txline/txline.module';
import { RealtimeModule } from './realtime/realtime.module';
import { FantasyModule } from './fantasy/fantasy.module';
import { LiveModule } from './live/live.module';
import { CrowdModule } from './crowd/crowd.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { MarketModule } from './market/market.module';
import { ChainModule } from './chain/chain.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Wildcard event bus: enables `goal.*`, `*.after`, etc. (see docs/architecture.md)
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
    PrismaModule,
    TxlineModule,
    RealtimeModule,
    FantasyModule,
    LiveModule,
    CrowdModule,
    UsersModule,
    AuthModule,
    WalletModule,
    MarketModule,
    ChainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
