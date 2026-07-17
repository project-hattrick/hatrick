import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

/** Hard cap on the in-memory fallback so a Redis outage can't balloon the heap. */
const MEMORY_MAX_ENTRIES = 500;

/**
 * Read-through cache: Redis when reachable, in-memory otherwise — never a boot
 * or availability dependency. `getOrSet` is single-flight per key, so N callers
 * racing on a cold key produce ONE upstream call (protects the TxLINE free tier).
 * Values are JSON round-tripped; callers own the key namespace and TTL policy.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private redisHealthy = false;
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.log('REDIS_URL not set — cache runs in-memory only.');
      return;
    }
    this.redis = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(30_000, 1_000 * 2 ** times),
    });
    this.redis.on('ready', () => {
      this.redisHealthy = true;
      this.logger.log('Redis cache connected.');
    });
    this.redis.on('error', (err: Error) => {
      if (this.redisHealthy)
        this.logger.warn(
          `Redis error — using in-memory fallback: ${err.message}`,
        );
      this.redisHealthy = false;
    });
    this.redis.connect().catch(() => {
      this.logger.warn(
        'Redis unreachable — cache runs in-memory until it comes back.',
      );
    });
  }

  onModuleDestroy(): void {
    this.redis?.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redisHealthy && this.redis) {
      try {
        const hit = await this.redis.get(key);
        return hit === null ? null : (JSON.parse(hit) as T);
      } catch {
        /* degraded — fall through to memory */
      }
    }
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    const raw = JSON.stringify(value);
    if (this.redisHealthy && this.redis) {
      try {
        await this.redis.set(key, raw, 'EX', ttlSeconds);
        return;
      } catch {
        /* degraded — fall through to memory */
      }
    }
    if (this.memory.size >= MEMORY_MAX_ENTRIES) {
      const oldest = this.memory.keys().next().value as string | undefined;
      if (oldest !== undefined) this.memory.delete(oldest);
    }
    this.memory.set(key, {
      value: raw,
      expiresAt: Date.now() + ttlSeconds * 1_000,
    });
  }

  /** Invalidate a key in both tiers (write paths call this so a cached read never goes stale). */
  async del(key: string): Promise<void> {
    this.memory.delete(key);
    if (this.redisHealthy && this.redis) {
      try {
        await this.redis.del(key);
      } catch {
        /* degraded — the memory copy is already gone */
      }
    }
  }

  /** Invalidate every key with a prefix in both tiers. Keep prefixes narrow. */
  async delPrefix(prefix: string): Promise<void> {
    for (const key of this.memory.keys()) {
      if (key.startsWith(prefix)) this.memory.delete(key);
    }
    if (this.redisHealthy && this.redis) {
      try {
        const keys = await this.redis.keys(`${prefix}*`);
        if (keys.length) await this.redis.del(...keys);
      } catch {
        /* degraded — the memory copies are already gone */
      }
    }
  }

  /** Read-through with single-flight: concurrent misses on a key share one factory call. */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    if (ttlSeconds <= 0) return factory();
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const running = this.inflight.get(key);
    if (running) return running as Promise<T>;

    const flight = (async () => {
      try {
        const value = await factory();
        await this.set(key, value, ttlSeconds);
        return value;
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, flight);
    return flight;
  }
}
