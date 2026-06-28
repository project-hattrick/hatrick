import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TxlineAuthService } from './txline-auth.service';
import { TxlineNormalizerService } from './txline-normalizer.service';
import { RawOddsEvent, RawScoreEvent } from './txline.types';

type StreamKind = 'scores' | 'odds';

/**
 * Connects to TxLINE SSE streams and forwards parsed frames to the normalizer.
 * Generic base: guarded by TXLINE_ENABLED so the app boots without credentials.
 * Backoff + Last-Event-ID resume are left as seams (docs/txline-provider.md).
 */
@Injectable()
export class TxlineIngestService implements OnModuleInit {
  private readonly logger = new Logger(TxlineIngestService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly auth: TxlineAuthService,
    private readonly normalizer: TxlineNormalizerService,
  ) {}

  onModuleInit(): void {
    if (this.config.get<string>('TXLINE_ENABLED') !== 'true') {
      this.logger.warn('TXLINE_ENABLED!=true — SSE ingest disabled (boot-safe).');
      return;
    }
    void this.connect('scores');
    void this.connect('odds');
  }

  private async connect(stream: StreamKind): Promise<void> {
    const url = `${this.auth.baseUrl}/api/${stream}/stream`;
    try {
      const res = await fetch(url, {
        headers: {
          ...this.auth.getHeaders(),
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok || !res.body) throw new Error(`status ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      this.logger.log(`connected to ${stream} stream`);

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          this.dispatch(stream, line.trim());
        }
      }
    } catch (err) {
      this.logger.error(`${stream} stream error: ${String(err)} — retry in 5s`);
      setTimeout(() => void this.connect(stream), 5000); // TODO: exponential backoff + resume
    }
  }

  private dispatch(stream: StreamKind, line: string): void {
    if (!line.startsWith('data:')) return;
    const json = line.slice(5).trim();
    if (!json) return;
    try {
      const msg = JSON.parse(json) as { data?: unknown; event?: string };
      if (msg.event === 'heartbeat' || !msg.data) return;
      if (stream === 'scores') this.normalizer.handleScore(msg.data as RawScoreEvent);
      else this.normalizer.handleOdds(msg.data as RawOddsEvent);
    } catch {
      // Ignore partial / non-JSON SSE frames in this base seam.
    }
  }
}
