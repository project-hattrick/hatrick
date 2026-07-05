import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Single Prisma connection for the app. Injected ONLY into `*.repository.ts`
 * files — no service/controller/listener touches it directly (docs/conventions.md).
 *
 * Logging is env-aware: full query logging in development, warnings/errors only
 * in production. `$disconnect` runs on shutdown via Nest lifecycle hooks
 * (main.ts calls `app.enableShutdownHooks()`).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'production'
          ? ['warn', 'error']
          : ['query', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('connected to Postgres');
    } catch (error) {
      this.logger.error('failed to connect to Postgres', error as Error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('disconnected from Postgres');
  }

  /** Lightweight round-trip used by the health endpoint. */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Truncate every model table in one transaction. DEV/seed ONLY — refuses to
   * run in production. Order-independent: uses TRUNCATE ... CASCADE.
   */
  async truncateAll(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('truncateAll() is disabled in production');
    }
    const tables = Prisma.dmmf.datamodel.models
      .map((model) => model.dbName ?? model.name)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`);
    if (tables.length === 0) return;
    await this.$executeRawUnsafe(
      `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE;`,
    );
    this.logger.warn(`truncated ${tables.length} table(s)`);
  }
}
