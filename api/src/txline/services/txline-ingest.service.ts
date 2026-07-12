import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TxlineAuthService } from './txline-auth.service';
import { TxlineNormalizerService } from './txline-normalizer.service';
import { TxlineSnapshotService } from './txline-snapshot.service';
import { mapWireOdds, mapWireScore, WireOddsEvent, WireScoreEvent } from './txline-mapper';
import { StreamKind } from '../txline.types';

const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
/** How often we re-scan the fixture list for matches entering/leaving the live window. */
const SWEEP_MS = 2 * 60 * 1_000;
/** Subscribe this long before scheduled kickoff… */
const PREGAME_LEAD_MS = 15 * 60 * 1_000;
/** …and keep the stream until this long after it (full match + stoppage headroom). */
const LIVE_WINDOW_MS = 3 * 60 * 60 * 1_000;
/** After `game_finalised`, let the confirmations/final odds land, then drop the fixture's streams. */
const POST_FT_GRACE_MS = 2 * 60 * 1_000;
/** How many raw penalty/VAR frames to dump before muting the probe (a VAR-heavy game can't flood logs). */
const PENALTY_PROBE_CAP = 60;

const STREAMS: StreamKind[] = ['scores', 'odds'];

/** One per-fixture SSE connection's lifecycle state. */
interface StreamConn {
  abort: AbortController;
  lastEventId: string | null;
  attempts: number;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Connects to TxLINE SSE streams and forwards parsed frames to the normalizer.
 *
 * Observed reality (confirmed live 10/07/2026): the parameterless stream returns 200 and then
 * NOTHING — data only flows on `?fixtureId=`. So this service sweeps the fixtures snapshot every
 * couple of minutes and keeps one scores + one odds stream open per fixture inside the live window
 * (15min before kickoff → 3h after). Frames put the event object DIRECTLY in `data:` (no `{id,data}`
 * wrapper) — the dispatcher tolerates both shapes.
 *
 * Owns the resilience the provider docs leave to us (docs/txline-provider.md): partial-frame
 * buffering, Last-Event-ID resume, exponential backoff, JWT refresh. Guarded by TXLINE_ENABLED so
 * the app boots without credentials.
 */
@Injectable()
export class TxlineIngestService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TxlineIngestService.name);
  private readonly conns = new Map<string, StreamConn>();
  /** Fixtures whose coverage ended (game_finalised → disconnected) — the sweep must not resubscribe. */
  private readonly finished = new Set<number>();
  private sweepTimer: NodeJS.Timeout | null = null;
  /** Raw penalty/VAR frames dumped so far (see probePenaltyFrame). */
  private penaltyProbes = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly auth: TxlineAuthService,
    private readonly snapshots: TxlineSnapshotService,
    private readonly normalizer: TxlineNormalizerService,
  ) {}

  onModuleInit(): void {
    if (this.config.get<string>('TXLINE_ENABLED') !== 'true') {
      this.logger.warn('TXLINE_ENABLED!=true — SSE ingest disabled (boot-safe).');
      return;
    }
    void this.sweep();
    this.sweepTimer = setInterval(() => void this.sweep(), SWEEP_MS);
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    for (const conn of this.conns.values()) conn.abort.abort();
    this.conns.clear();
  }

  /** Reconcile open streams with the fixtures currently inside the live window. */
  private async sweep(): Promise<void> {
    try {
      const fixtures = await this.snapshots.getFixtures();
      const now = Date.now();
      const live = new Set<number>();
      for (const fixture of fixtures) {
        if (this.finished.has(fixture.FixtureId)) continue;
        const start = fixture.StartTime < 1e12 ? fixture.StartTime * 1000 : fixture.StartTime;
        if (start <= now + PREGAME_LEAD_MS && start >= now - LIVE_WINDOW_MS) live.add(fixture.FixtureId);
      }

      for (const fixtureId of live) {
        for (const stream of STREAMS) this.ensure(stream, fixtureId);
      }
      for (const [key, conn] of this.conns) {
        const fixtureId = Number(key.split(':')[1]);
        if (!live.has(fixtureId)) {
          conn.abort.abort();
          this.conns.delete(key);
          this.logger.log(`closed ${key} (fixture left the live window)`);
        }
      }
    } catch (err) {
      this.logger.warn(`fixture sweep failed: ${String(err)}`);
    }
  }

  /** Abort and forget both streams of a fixture (post-full-time cleanup). */
  private closeFixture(fixtureId: number): void {
    for (const stream of STREAMS) {
      const key = `${stream}:${fixtureId}`;
      const conn = this.conns.get(key);
      if (!conn) continue;
      conn.abort.abort();
      this.conns.delete(key);
      this.logger.log(`closed ${key} (full-time)`);
    }
  }

  /** Open (once) a resilient stream for a fixture — reconnect loop lives in run(). */
  private ensure(stream: StreamKind, fixtureId: number): void {
    const key = `${stream}:${fixtureId}`;
    if (this.conns.has(key)) return;
    const conn: StreamConn = { abort: new AbortController(), lastEventId: null, attempts: 0 };
    this.conns.set(key, conn);
    this.logger.log(`subscribing ${key} (live window)`);
    void this.run(stream, fixtureId, conn);
  }

  private async run(stream: StreamKind, fixtureId: number, conn: StreamConn): Promise<void> {
    const key = `${stream}:${fixtureId}`;
    // The free tier delivers data ONLY on the per-fixture stream (paramless = silent 200).
    const url = `${this.auth.baseUrl}/api/${stream}/stream?fixtureId=${fixtureId}`;
    while (this.conns.get(key) === conn && !conn.abort.signal.aborted) {
      try {
        const headers: Record<string, string> = {
          ...(await this.auth.getHeaders()),
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        };
        if (conn.lastEventId) headers['Last-Event-ID'] = conn.lastEventId;

        const res = await fetch(url, { headers, signal: conn.abort.signal });
        if (res.status === 401) {
          await this.auth.refreshGuestJwt();
          throw new Error('401 — refreshed JWT, reconnecting');
        }
        if (!res.ok || !res.body) throw new Error(`status ${res.status}`);

        conn.attempts = 0;
        this.logger.log(`connected ${key}`);
        await this.pump(stream, conn, res.body);
        throw new Error('stream ended'); // normal end → reconnect via catch
      } catch (err) {
        if (conn.abort.signal.aborted) return;
        const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** conn.attempts++);
        this.logger.error(`${key} stream error: ${String(err)} — retry in ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  private async pump(stream: StreamKind, conn: StreamConn, body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      let nl = buffer.indexOf('\n');
      while (nl !== -1) {
        this.dispatch(stream, conn, buffer.slice(0, nl).trim());
        buffer = buffer.slice(nl + 1);
        nl = buffer.indexOf('\n');
      }
    }
  }

  /**
   * One-off characterization probe: dumps the UNTOUCHED wire shape of penalty/VAR frames so the real
   * schema gets pinned from a live match instead of guessed. Two open questions this answers (see
   * docs/txline-provider.md): does a penalty award arrive as `Action:"penalty"` or only as a stat key
   * (penaltyAttempts/penaltyGoals), and what `Outcome` vocabulary do miss/save/retake actually use.
   * Runs BEFORE the mapper, so it still catches a frame the mapper would route as Unknown. Capped so a
   * VAR-heavy game can't flood the logs; delete this probe once the shape is confirmed.
   */
  private probePenaltyFrame(payload: unknown): void {
    if (this.penaltyProbes >= PENALTY_PROBE_CAP) return;
    let blob: string;
    try {
      blob = JSON.stringify(payload);
    } catch {
      return; // circular / unserializable — nothing to characterize
    }
    const lower = blob.toLowerCase();
    // `penalt` catches the action AND the stat keys (penaltyAttempts/penaltyGoals) — the whole point is
    // to see WHICH mechanism carries it. The action/flag checks catch VAR-awarded penalties.
    const isPenalty = lower.includes('penalt');
    const isVar = /"action"\s*:\s*"[^"]*var/.test(lower) || /"var"\s*:\s*true/.test(lower);
    if (!isPenalty && !isVar) return;
    this.penaltyProbes += 1;
    const tag = isPenalty ? 'PENALTY' : 'VAR';
    const snippet = blob.length > 2_000 ? `${blob.slice(0, 2_000)}…(+${blob.length - 2_000}b)` : blob;
    this.logger.warn(`[${tag}-PROBE ${this.penaltyProbes}/${PENALTY_PROBE_CAP}] raw wire frame → ${snippet}`);
    if (this.penaltyProbes === PENALTY_PROBE_CAP) {
      this.logger.warn('[PENALTY-PROBE] cap reached — further penalty/VAR frames muted this session.');
    }
  }

  private dispatch(stream: StreamKind, conn: StreamConn, line: string): void {
    if (!line || line.startsWith(':')) return; // blank line / SSE comment
    if (line.startsWith('id:')) {
      conn.lastEventId = line.slice(3).trim();
      return;
    }
    if (!line.startsWith('data:')) return;
    const json = line.slice(5).trim();
    if (!json) return;
    try {
      const msg = JSON.parse(json) as { id?: string; data?: unknown; event?: string };
      if (!msg || typeof msg !== 'object') return;
      if (msg.id) conn.lastEventId = String(msg.id);
      if (msg.event === 'heartbeat') return;
      // Wire reality: the event object IS the data payload; tolerate a wrapped {data} shape too.
      const payload = msg.data && typeof msg.data === 'object' ? msg.data : msg;
      // Mappers return null for unroutable frames — skip rather than emit garbage.
      if (stream === 'scores') {
        this.probePenaltyFrame(payload);
        const ev = mapWireScore(payload as WireScoreEvent);
        if (ev) this.normalizer.handleScore(ev);
        // Observed end sequence: game_finalised → disconnected. Drop the fixture's streams after a
        // short grace (final confirmations + closing odds), or bookmakers re-price for hours.
        if (ev && ev.confirmed && ev.action === 'game_finalised' && !this.finished.has(ev.fixtureId)) {
          this.finished.add(ev.fixtureId);
          this.logger.log(`fixture ${ev.fixtureId} finalised — closing streams in ${POST_FT_GRACE_MS / 1000}s`);
          setTimeout(() => this.closeFixture(ev.fixtureId), POST_FT_GRACE_MS);
        }
      } else {
        const ev = mapWireOdds(payload as WireOddsEvent);
        if (ev) this.normalizer.handleOdds(ev);
      }
    } catch {
      // Ignore non-JSON SSE frames.
    }
  }
}
