import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TxlineAuthService } from './txline-auth.service';
import { TxlineNormalizerService } from './txline-normalizer.service';
import { RawOddsEvent, RawScoreEvent, StreamKind } from './txline.types';

const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;

/**
 * Connects to TxLINE SSE streams and forwards parsed frames to the normalizer.
 * Owns the resilience the provider docs leave to us (docs/txline-provider.md):
 * partial-frame buffering, Last-Event-ID resume, exponential backoff, JWT refresh.
 * Guarded by TXLINE_ENABLED so the app boots without credentials.
 */
@Injectable()
export class TxlineIngestService implements OnModuleInit {
  private readonly logger = new Logger(TxlineIngestService.name);
  private readonly lastEventId: Record<StreamKind, string | null> = { scores: null, odds: null };
  private readonly attempts: Record<StreamKind, number> = { scores: 0, odds: 0 };

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
      const headers: Record<string, string> = {
        ...(await this.auth.getHeaders()),
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      };
      const resume = this.lastEventId[stream];
      if (resume) headers['Last-Event-ID'] = resume;

      const res = await fetch(url, { headers });
      if (res.status === 401) {
        await this.auth.refreshGuestJwt();
        throw new Error('401 — refreshed JWT, reconnecting');
      }
      if (!res.ok || !res.body) throw new Error(`status ${res.status}`);

      this.attempts[stream] = 0;
      this.logger.log(`connected to ${stream} stream`);
      await this.pump(stream, res.body);
      throw new Error('stream ended'); // normal end → reconnect via catch
    } catch (err) {
      const delay = this.backoff(stream);
      this.logger.error(`${stream} stream error: ${String(err)} — retry in ${delay}ms`);
      setTimeout(() => void this.connect(stream), delay);
    }
  }

  private async pump(stream: StreamKind, body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      let nl = buffer.indexOf('\n');
      while (nl !== -1) {
        this.dispatch(stream, buffer.slice(0, nl).trim());
        buffer = buffer.slice(nl + 1);
        nl = buffer.indexOf('\n');
      }
    }
  }

  private dispatch(stream: StreamKind, line: string): void {
    if (!line || line.startsWith(':')) return; // blank line / SSE comment
    if (line.startsWith('id:')) {
      this.lastEventId[stream] = line.slice(3).trim();
      return;
    }
    if (!line.startsWith('data:')) return;
    const json = line.slice(5).trim();
    if (!json) return;
    try {
      const msg = JSON.parse(json) as { id?: string; data?: unknown; event?: string };
      if (msg.id) this.lastEventId[stream] = msg.id;
      if (msg.event === 'heartbeat' || !msg.data) return;
      if (stream === 'scores') this.normalizer.handleScore(msg.data as RawScoreEvent);
      else this.normalizer.handleOdds(msg.data as RawOddsEvent);
    } catch {
      // Ignore non-JSON SSE frames.
    }
  }

  private backoff(stream: StreamKind): number {
    const n = this.attempts[stream]++;
    return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** n);
  }
}
