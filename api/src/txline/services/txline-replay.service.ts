import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CacheService } from '../../common/cache/cache.service';
import { TxlineCacheTtl, historicalIntervalTtl } from './txline-cache-ttl';
import { TxlineHttpService } from './txline-http.service';
import { TxlineNormalizerService } from './txline-normalizer.service';
import { mapWireOdds, mapWireScore, WireOddsEvent, WireScoreEvent } from './txline-mapper';
import { RawScoreEvent } from '../txline.types';

const INTERVALS_PER_HOUR = 12; // 5-min buckets
const DEFAULT_HOURS = 3; // a match window + extra time
const DEFAULT_SPEED = 8; // playback multiplier (real gaps ÷ speed)
const MAX_GAP_MS = 4_000; // cap idle gaps so replay never stalls
const CATALOG_HOURS = [13, 16, 19, 20]; // where the sim tournament's kickoffs land
const COMPETITION_NAMES: Record<number, string> = { 72: 'World Cup', 430: 'Friendlies' };

export interface ReplayOptions {
  fixtureId: number;
  epochDay: number; // day the match started (floor(startMs/86_400_000))
  startHour: number; // UTC hour of kickoff
  hours?: number;
  speed?: number;
}

/** A finished fixture the user can replay (discovered from historical updates). */
export interface ReplayCatalogItem {
  fixtureId: number;
  home: string;
  away: string;
  competition: string;
  startTime: number;
  epochDay: number;
  startHour: number;
}

type Frame = { ts: number; kind: 'score' | 'odds'; ev: WireScoreEvent | WireOddsEvent };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const NOTABLE_ACTIONS = new Set(['goal', 'yellow_card', 'red_card', 'corner', 'penalty']);

/** One notable moment on a fixture's timeline, carrying the authoritative score at that point. */
export interface TimelineEvent {
  minute: number;
  action: string;
  participant?: number;
  home: number;
  away: number;
}

export interface FixtureTimeline {
  fixtureId: number;
  events: TimelineEvent[];
  finalHome: number;
  finalAway: number;
  durationMin: number;
}

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
    private readonly cache: CacheService,
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

  /** Discover finished fixtures the user can replay (Redis-cached ~5 min, single-flight, shared across instances). */
  async catalog(daysBack = 5): Promise<ReplayCatalogItem[]> {
    return this.cache.getOrSet(`replay:catalog:v1:${daysBack}`, TxlineCacheTtl.ReplayCatalog, () =>
      this.buildCatalog(daysBack),
    );
  }

  private async buildCatalog(daysBack: number): Promise<ReplayCatalogItem[]> {
    const today = Math.floor(Date.now() / 86_400_000);
    const found = new Map<number, { startTime: number; competitionId: number; p1: number; p2: number }>();
    for (let d = today - Math.max(1, daysBack); d <= today; d++) {
      for (const h of CATALOG_HOURS) {
        const evs = await this.http
          .getCached<WireScoreEvent[]>(`/api/scores/updates/${d}/${h}/0`, historicalIntervalTtl(d, h, 0))
          .catch(() => []);
        for (const e of Array.isArray(evs) ? evs : []) {
          const fixtureId = Number(e.FixtureId);
          const startTime = Number(e.StartTime);
          if (!fixtureId || !startTime || found.has(fixtureId)) continue;
          found.set(fixtureId, { startTime, competitionId: Number(e.CompetitionId), p1: Number(e.Participant1Id), p2: Number(e.Participant2Id) });
        }
      }
    }

    const names = await this.teamNames();
    const now = Date.now();
    const items = [...found.entries()]
      .filter(([, f]) => f.startTime < now) // finished/started matches only
      .sort((a, b) => b[1].startTime - a[1].startTime)
      .slice(0, 40)
      .map(([fixtureId, f]) => ({
        fixtureId,
        home: names.team.get(f.p1) ?? `Team ${f.p1}`,
        away: names.team.get(f.p2) ?? `Team ${f.p2}`,
        competition: names.comp.get(f.competitionId) ?? COMPETITION_NAMES[f.competitionId] ?? `Competition ${f.competitionId}`,
        startTime: f.startTime,
        epochDay: Math.floor(f.startTime / 86_400_000),
        startHour: new Date(f.startTime).getUTCHours(),
      }));

    this.logger.log(`replay catalog: ${items.length} past fixtures (scanned ${daysBack + 1} days)`);
    return items;
  }

  /** Best-effort id→name maps from the widest fixtures snapshot available. */
  private async teamNames(): Promise<{ team: Map<number, string>; comp: Map<number, string> }> {
    const team = new Map<number, string>();
    const comp = new Map<number, string>();
    try {
      const today = Math.floor(Date.now() / 86_400_000);
      // Cached read: this 30-day snapshot was refetched on every catalog build — a wasted upstream call
      // to the free tier, since the id→name maps barely change within a session.
      const fx = await this.http.getCached<Record<string, unknown>[]>(
        `/api/fixtures/snapshot?startEpochDay=${today - 30}`,
        TxlineCacheTtl.ReplayNames,
      );
      for (const f of Array.isArray(fx) ? fx : []) {
        const p1 = Number(f.Participant1Id);
        const p2 = Number(f.Participant2Id);
        if (p1 && typeof f.Participant1 === 'string') team.set(p1, f.Participant1);
        if (p2 && typeof f.Participant2 === 'string') team.set(p2, f.Participant2);
        const c = Number(f.CompetitionId);
        if (c && typeof f.Competition === 'string') comp.set(c, f.Competition);
      }
    } catch {
      /* names are best-effort; fall back to ids */
    }
    return { team, comp };
  }

  /**
   * The full notable-event timeline for a fixture (goals/cards/corners with the authoritative
   * cumulative score at each), for a FRONT-driven, seekable replay — no live stream needed.
   */
  async timeline(opts: ReplayOptions): Promise<FixtureTimeline> {
    const hours = opts.hours ?? DEFAULT_HOURS;
    // A finished fixture's timeline never changes — cache the assembled DTO (24h) so we don't re-load +
    // re-dedupe 36 intervals per request. While the window is still in-play the TTL resolves to 0 (bypass).
    const lastAbs = opts.startHour + hours - 1;
    const lastDay = opts.epochDay + Math.floor(lastAbs / 24);
    const lastHour = ((lastAbs % 24) + 24) % 24;
    const ttl = historicalIntervalTtl(lastDay, lastHour, INTERVALS_PER_HOUR - 1) > 0 ? TxlineCacheTtl.FinishedMatch : TxlineCacheTtl.None;
    return this.cache.getOrSet(
      `replay:timeline:v1:${opts.fixtureId}:${opts.epochDay}:${opts.startHour}:${hours}`,
      ttl,
      () => this.buildTimeline(opts, hours),
    );
  }

  private async buildTimeline(opts: ReplayOptions, hours: number): Promise<FixtureTimeline> {
    const frames = await this.load(opts.fixtureId, opts.epochDay, opts.startHour, hours);
    let home = 0;
    let away = 0;
    let lastMinute = 0;
    const seen = new Set<number>();
    const events: TimelineEvent[] = [];

    for (const f of frames) {
      if (f.kind !== 'score') continue;
      const raw = mapWireScore(f.ev as WireScoreEvent);
      if (!raw || !raw.confirmed) continue; // authoritative frames only
      if (raw.homeGoals !== undefined) home = raw.homeGoals;
      if (raw.awayGoals !== undefined) away = raw.awayGoals;
      const minute = raw.dataSoccer?.Minutes ?? lastMinute;
      lastMinute = Math.max(lastMinute, minute);
      const action = raw.action ?? '';
      if (!NOTABLE_ACTIONS.has(action) || seen.has(raw.seq)) continue;
      seen.add(raw.seq);
      events.push({ minute, action, participant: raw.dataSoccer?.Participant, home, away });
    }

    events.sort((a, b) => a.minute - b.minute);
    return { fixtureId: opts.fixtureId, events, finalHome: home, finalAway: away, durationMin: Math.max(90, lastMinute) };
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

    const superseded = () => myId !== this.runId;
    for (const f of frames) {
      if (superseded()) {
        this.logger.log('replay superseded/stopped — exiting loop');
        return { frames: emitted, goals: [final.home ?? tally[0], final.away ?? tally[1]] };
      }
      // At 1:1 (speed ≤ 1) honor the real inter-event gap so the match plays back in true real time; faster
      // speeds keep the idle-gap cap so quiet stretches don't stall. Sleep in ≤1s chunks so a stop/supersede
      // is picked up promptly even across a long real gap (e.g. half-time).
      const realGap = Math.max(0, (f.ts - prevTs) / speed);
      let wait = speed <= 1 ? realGap : Math.min(MAX_GAP_MS, realGap);
      prevTs = f.ts;
      while (wait > 0) {
        if (superseded()) {
          this.logger.log('replay superseded/stopped — exiting loop');
          return { frames: emitted, goals: [final.home ?? tally[0], final.away ?? tally[1]] };
        }
        const chunk = Math.min(wait, 1_000);
        await sleep(chunk);
        wait -= chunk;
      }

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
        // Finished intervals are immutable — cached reads make re-running a replay nearly free.
        const ttl = historicalIntervalTtl(day, hour, iv);
        const [scores, odds] = await Promise.all([
          this.http.getCached<WireScoreEvent[]>(`/api/scores/updates/${day}/${hour}/${iv}`, ttl).catch(() => []),
          this.http.getCached<WireOddsEvent[]>(`/api/odds/updates/${day}/${hour}/${iv}`, ttl).catch(() => []),
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
