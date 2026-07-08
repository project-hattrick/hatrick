import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TxlineHttpService } from './txline-http.service';
import { TxlineNormalizerService } from './txline-normalizer.service';
import { mapWireOdds, mapWireScore, WireOddsEvent, WireScoreEvent } from './txline-mapper';
import { RawScoreEvent } from '../txline.types';

const INTERVALS_PER_HOUR = 12; // 5-min buckets
const DEFAULT_HOURS = 3; // a match window + extra time
const DEFAULT_SPEED = 8; // playback multiplier (real gaps ÷ speed)
const MAX_GAP_MS = 4_000; // cap idle gaps so replay never stalls

export interface ReplayOptions {
  fixtureId: number;
  epochDay: number; // day the match started (floor(startMs/86_400_000))
  startHour: number; // UTC hour of kickoff
  hours?: number;
  speed?: number;
}

type Frame = { ts: number; kind: 'score' | 'odds'; ev: WireScoreEvent | WireOddsEvent };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Replays a past fixture from the historical `/updates` endpoints through the
 * same normalizer as the live SSE — so `*.during`/`*.after`, odds and match-end
 * settlement all fire off real data even when no match is live. Config-gated;
 * also triggerable on demand via the controller. See docs/txline-provider.md.
 */
@Injectable()
export class TxlineReplayService implements OnModuleInit {
  private readonly logger = new Logger(TxlineReplayService.name);
  private runId = 0; // bump invalidates any in-flight playback (single-flight)
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly http: TxlineHttpService,
    private readonly normalizer: TxlineNormalizerService,
  ) {}

  onModuleInit(): void {
    if (this.config.get<string>('TXLINE_REPLAY_ENABLED') !== 'true') return;
    const fixtureId = Number(this.config.get('TXLINE_REPLAY_FIXTURE_ID'));
    const epochDay = Number(this.config.get('TXLINE_REPLAY_EPOCH_DAY'));
    const startHour = Number(this.config.get('TXLINE_REPLAY_START_HOUR'));
    if (!fixtureId || !epochDay || Number.isNaN(startHour)) {
      this.logger.warn('TXLINE_REPLAY_ENABLED=true but FIXTURE_ID/EPOCH_DAY/START_HOUR missing — skipping.');
      return;
    }
    void this.start({
      fixtureId,
      epochDay,
      startHour,
      hours: Number(this.config.get('TXLINE_REPLAY_HOURS')) || undefined,
      speed: Number(this.config.get('TXLINE_REPLAY_SPEED')) || undefined,
    }).catch((e) => this.logger.error(`replay failed: ${String(e)}`));
  }

  isRunning(): boolean {
    return this.running;
  }

  stop(): void {
    this.runId++; // any active loop sees a stale id and bails
    this.running = false;
  }

  /** Load a fixture's history, order by Ts, and play it through the normalizer. */
  async start(opts: ReplayOptions): Promise<{ frames: number; goals: [number, number] }> {
    const myId = ++this.runId; // supersede any prior replay
    const speed = opts.speed ?? DEFAULT_SPEED;
    const hours = opts.hours ?? DEFAULT_HOURS;

    const frames = await this.load(opts.fixtureId, opts.epochDay, opts.startHour, hours);
    this.logger.log(
      `replay fixture ${opts.fixtureId}: ${frames.length} frames loaded (${hours}h from day ${opts.epochDay} ${opts.startHour}:00 UTC), speed ${speed}x`,
    );
    if (!frames.length) {
      this.logger.warn('no frames for fixture — nothing to replay');
      return { frames: 0, goals: [0, 0] };
    }

    this.running = true;
    const final: { home?: number; away?: number } = {}; // authoritative Score.Total.Goals
    const tally: [number, number] = [0, 0]; // fallback: counted confirmed goal actions
    let prevTs = frames[0].ts;
    let emitted = 0;

    for (const f of frames) {
      if (myId !== this.runId) {
        this.logger.log('replay superseded/stopped — exiting loop');
        return { frames: emitted, goals: [final.home ?? tally[0], final.away ?? tally[1]] };
      }
      const wait = Math.min(MAX_GAP_MS, Math.max(0, (f.ts - prevTs) / speed));
      prevTs = f.ts;
      if (wait) await sleep(wait);

      if (f.kind === 'odds') {
        const ev = mapWireOdds(f.ev as WireOddsEvent);
        if (ev) this.normalizer.handleOdds(ev);
      } else {
        const raw = mapWireScore(f.ev as WireScoreEvent);
        if (!raw) continue;
        if (raw.confirmed && raw.dataSoccer?.Goal) tally[raw.dataSoccer.Participant === 2 ? 1 : 0]++;
        if (raw.homeGoals !== undefined) final.home = raw.homeGoals;
        if (raw.awayGoals !== undefined) final.away = raw.awayGoals;
        this.normalizer.handleScore(raw);
      }
      emitted++;
    }

    // Guarantee the settlement path runs: synthesize a confirmed full-time so
    // maybeEmitMatchEnd fires even if the feed's GameState never flips.
    const home = final.home ?? tally[0];
    const away = final.away ?? tally[1];
    if (myId === this.runId) {
      this.emitFullTime(opts.fixtureId, home, away, prevTs);
      this.logger.log(`replay done: ${emitted} frames, final ${home}-${away}, match-end emitted`);
    }
    this.running = this.runId === myId ? false : this.running;
    return { frames: emitted, goals: [home, away] };
  }

  /** Fetch every 5-min interval across the window and keep this fixture's events.
   * Dedupes events that straddle interval boundaries (they appear in two buckets). */
  private async load(fixtureId: number, epochDay: number, startHour: number, hours: number): Promise<Frame[]> {
    const frames: Frame[] = [];
    const seen = new Set<string>();
    for (let h = 0; h < hours; h++) {
      const abs = startHour + h;
      const day = epochDay + Math.floor(abs / 24);
      const hour = ((abs % 24) + 24) % 24;
      for (let iv = 0; iv < INTERVALS_PER_HOUR; iv++) {
        const [scores, odds] = await Promise.all([
          this.http.get<WireScoreEvent[]>(`/api/scores/updates/${day}/${hour}/${iv}`).catch(() => []),
          this.http.get<WireOddsEvent[]>(`/api/odds/updates/${day}/${hour}/${iv}`).catch(() => []),
        ]);
        for (const ev of Array.isArray(scores) ? scores : []) {
          if ((ev.FixtureId ?? ev.fixtureId) !== fixtureId) continue;
          const key = `s:${ev.Seq ?? ev.seq}:${ev.Confirmed ?? ev.confirmed}:${ev.Ts ?? ev.ts}`;
          if (seen.has(key)) continue;
          seen.add(key);
          frames.push({ ts: Number(ev.Ts ?? ev.ts), kind: 'score', ev });
        }
        for (const ev of Array.isArray(odds) ? odds : []) {
          if ((ev.FixtureId ?? ev.fixtureId) !== fixtureId) continue;
          const key = `o:${ev.MessageId ?? ev.Ts ?? ev.ts}`;
          if (seen.has(key)) continue;
          seen.add(key);
          frames.push({ ts: Number(ev.Ts ?? ev.ts), kind: 'odds', ev });
        }
      }
    }
    frames.sort((a, b) => a.ts - b.ts);
    return frames;
  }

  private emitFullTime(fixtureId: number, home: number, away: number, ts: number): void {
    const raw: RawScoreEvent = {
      fixtureId,
      gameState: 'FullTime',
      action: 'full_time',
      ts: ts + 1,
      seq: Number.MAX_SAFE_INTEGER,
      confirmed: true,
      homeGoals: home,
      awayGoals: away,
      scoreSoccer: { Participant1: { Total: { Goals: home } }, Participant2: { Total: { Goals: away } } },
      dataSoccer: { Action: 'full_time' },
    };
    this.normalizer.handleScore(raw);
  }
}
