import { FactoryProvider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrivyClient } from '@privy-io/server-auth';

/** DI token for the shared PrivyClient instance. */
export const PRIVY_CLIENT = Symbol('PRIVY_CLIENT');

const logger = new Logger('PrivyProvider');

export const privyClientProvider: FactoryProvider<PrivyClient> = {
  provide: PRIVY_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): PrivyClient => {
    const appId = config.get<string>('PRIVY_APP_ID');
    const appSecret = config.get<string>('PRIVY_APP_SECRET');

    if (!appId || !appSecret) {
      logger.warn(
        'PRIVY_APP_ID or PRIVY_APP_SECRET not set — POST /auth/login will throw 401 for all requests',
      );
    }

    // The verification key isn't a constructor option in this SDK version; verifyAuthToken()
    // (used in auth.service) accepts it as an optional arg, and falls back to Privy's API
    // verification endpoint when absent — which is what we do here.
    return new PrivyClient(appId ?? '', appSecret ?? '');
  },
};
