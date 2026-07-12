import { randomUUID } from 'node:crypto';

import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { UserRepository } from '../users/repositories';
import { CrowdGateway } from './crowd.gateway';
import type { CrowdMessageBroadcastDto, SendCrowdMessageDto } from './dto/crowd-message.dto';

/** Minimum gap between two balloons from the same user (documented cadence: <= 1 / 2s). */
const RATE_LIMIT_MS = 2_000;

/** C0 control block + DEL — replaced with spaces before the whitespace collapse. */
const isControlChar = (code: number): boolean => code < 32 || code === 127;

/**
 * Crowd balloon pipeline: authenticated viewer messages -> sanitize -> rate limit ->
 * global broadcast over the crowd gateway. Ephemeral by design (nothing persisted) --
 * the simulated ambient pool on the front keeps running alongside real balloons.
 */
@Injectable()
export class CrowdService {
  private readonly logger = new Logger(CrowdService.name);
  private readonly lastSentAt = new Map<string, number>();

  constructor(
    private readonly users: UserRepository,
    private readonly gateway: CrowdGateway,
  ) {}

  async send(userId: string, dto: SendCrowdMessageDto): Promise<{ ok: true }> {
    const now = Date.now();
    const last = this.lastSentAt.get(userId) ?? 0;
    if (now - last < RATE_LIMIT_MS) {
      throw new HttpException('Too many messages — wait a moment', HttpStatus.TOO_MANY_REQUESTS);
    }

    const text = this.sanitize(dto.text);
    if (!text) return { ok: true }; // whitespace-only — silently drop

    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    this.lastSentAt.set(userId, now);
    const payload: CrowdMessageBroadcastDto = {
      id: randomUUID(),
      userId,
      author:
        user.displayName ??
        user.username ??
        `${user.walletAddress.slice(0, 4)}…${user.walletAddress.slice(-4)}`,
      country: user.country,
      text,
      fixtureId: dto.fixtureId ?? null,
      ts: now,
    };
    this.gateway.broadcastMessage(payload);
    return { ok: true };
  }

  /** Trim, collapse runs of whitespace, strip control characters. */
  private sanitize(raw: string): string {
    let cleaned = '';
    for (const ch of raw) {
      cleaned += isControlChar(ch.charCodeAt(0)) ? ' ' : ch;
    }
    return cleaned.replace(/\s+/g, ' ').trim();
  }
}
