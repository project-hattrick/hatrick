import { BetStatus } from '@/enums/bet-status.enum';
import { MatchAction } from '@/enums/match-action.enum';
import { HATBOT_CADENCE, HatBotPriority, hatbotHeadlines } from '@/config/hatbot.config';
import { crowdReactions } from '@/config/crowd-reactions.config';
import { buildFanBurst, ambientFanMessage } from '@/lib/crowd/fan-burst';
import {
  buildHeadline,
  buildBetCta,
  buildPostGoalCta,
  buildLoginCta,
  buildInsight,
  buildBetWon,
} from '@/lib/crowd/hatbot-messages';
import { useCrowdStore } from '@/store/crowd.store';
import { useMatchStore } from '@/store/match.store';
import { useBetsStore } from '@/store/bets.store';
import type { Bet } from '@/types/bet';
import type { CrowdMessage } from '@/types/crowd';
import type { MatchEventPayload } from '@/types/match';

type QueueKind = 'event' | 'cta' | 'insight' | 'login';

interface QueueItem {
  kind: QueueKind;
  priority: HatBotPriority;
  enqueuedAt: number;
  build: () => CrowdMessage | null;
}

const eventKey = (event: MatchEventPayload): string => `${event.fixtureId}:${event.seq}`;

/** An event is notable when the fans or the bot have something to say about it. */
const isNotable = (event: MatchEventPayload): boolean =>
  event.action in crowdReactions || event.action in hatbotHeadlines;

/**
 * The crowd director: taps the match store (covers WS, replay frames and snapshots in both
 * mock and backend modes) and turns new events into team-aware fan bursts plus a single
 * cadenced HatBot voice (headlines > CTAs > insights, cooldown-gated, never spammy).
 */
class CrowdDirector {
  private queue: QueueItem[] = [];
  private seen = new Set<string>();
  private fixtureId: number | null = null;
  private lastBotAt = 0;
  private lastCtaAt = 0;
  private loginPrompts = 0;
  private timeouts = new Set<ReturnType<typeof setTimeout>>();
  private intervals: ReturnType<typeof setInterval>[] = [];
  private unsubscribers: Array<() => void> = [];

  start(): void {
    const matchState = useMatchStore.getState();
    this.fixtureId = matchState.match?.fixtureId ?? null;
    matchState.events.forEach((event) => this.seen.add(eventKey(event)));

    this.unsubscribers.push(
      useMatchStore.subscribe((state, prev) => {
        if (state.events !== prev.events || state.match?.fixtureId !== prev.match?.fixtureId) {
          this.onMatchChange(state.match?.fixtureId ?? null, state.events);
        }
      }),
      useBetsStore.subscribe((state, prev) => {
        if (state.settled !== prev.settled) this.onSettled(state.settled, prev.settled);
      }),
    );

    this.intervals.push(
      setInterval(() => this.drain(), HATBOT_CADENCE.drainTickMs),
      setInterval(() => useCrowdStore.getState().add(ambientFanMessage(useMatchStore.getState().match)), HATBOT_CADENCE.ambientMs),
      setInterval(() => this.enqueue('cta', HatBotPriority.Cta, () => buildBetCta(useMatchStore.getState().match)), HATBOT_CADENCE.ctaCooldownMs),
      setInterval(() => this.enqueueInsight(), HATBOT_CADENCE.insightCooldownMs),
      setInterval(() => this.enqueueLogin(), HATBOT_CADENCE.loginCooldownMs),
    );
    // Early staggered nudges so a fresh demo session shows the bot's range quickly.
    this.later(15_000, () => this.enqueueLogin());
    this.later(22_000, () => this.enqueue('cta', HatBotPriority.Cta, () => buildBetCta(useMatchStore.getState().match)));
    this.later(33_000, () => this.enqueueInsight());
  }

  stop(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.intervals.forEach((interval) => clearInterval(interval));
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.unsubscribers = [];
    this.intervals = [];
    this.timeouts.clear();
    this.queue = [];
    this.seen.clear();
  }

  private later(delayMs: number, fn: () => void): void {
    const timeout = setTimeout(() => {
      this.timeouts.delete(timeout);
      fn();
    }, delayMs);
    this.timeouts.add(timeout);
  }

  private enqueue(kind: QueueKind, priority: HatBotPriority, build: () => CrowdMessage | null): void {
    this.queue.push({ kind, priority, enqueuedAt: Date.now(), build });
  }

  private enqueueInsight(): void {
    this.enqueue('insight', HatBotPriority.Insight, () => {
      const { match, events } = useMatchStore.getState();
      return buildInsight(match, events);
    });
  }

  private enqueueLogin(): void {
    if (this.loginPrompts >= HATBOT_CADENCE.maxLoginPrompts) return;
    this.enqueue('login', HatBotPriority.Cta, () => buildLoginCta());
  }

  /** Diff the event list by fixture:seq — new notable events trigger reactions once. */
  private onMatchChange(fixtureId: number | null, events: MatchEventPayload[]): void {
    if (fixtureId !== this.fixtureId) {
      // Fresh match (or replay pick): baseline silently, no burst from history.
      this.fixtureId = fixtureId;
      this.seen = new Set(events.map(eventKey));
      this.queue = this.queue.filter((item) => item.kind !== 'event');
      return;
    }
    const fresh = events.filter((event) => !this.seen.has(eventKey(event)));
    fresh.forEach((event) => this.seen.add(eventKey(event)));
    const notable = fresh.filter(isNotable);
    if (notable.length === 0) return;
    // A replay seek can land a batch at once — react only to the latest moment.
    const toReact = notable.length > 2 ? notable.slice(-1) : notable;
    toReact.forEach((event) => this.reactTo(event));
  }

  private reactTo(event: MatchEventPayload): void {
    const match = useMatchStore.getState().match;
    if (!match) return;
    for (const { delayMs, message } of buildFanBurst(match, event)) {
      this.later(delayMs, () => useCrowdStore.getState().add(message));
    }
    this.enqueue('event', HatBotPriority.Event, () => {
      const current = useMatchStore.getState().match;
      return current ? buildHeadline(current, event) : null;
    });
    if (event.action === MatchAction.Goal) this.scheduleGoalCta();
  }

  private scheduleGoalCta(): void {
    this.later(HATBOT_CADENCE.postGoalCtaDelayMs, () =>
      this.enqueue('cta', HatBotPriority.Cta, () => buildPostGoalCta(useMatchStore.getState().match)),
    );
  }

  /** A freshly-won user bet is a crowd moment — celebrate it with a share CTA. */
  private onSettled(settled: Bet[], prev: Bet[]): void {
    const known = new Set(prev.map((bet) => bet.id));
    const fresh = settled.filter((bet) => !known.has(bet.id) && bet.status === BetStatus.Won);
    fresh.forEach((bet) => this.enqueue('event', HatBotPriority.Event, () => buildBetWon(bet)));
  }

  /** Post at most one bot message per gap, highest priority first, dropping stale moments. */
  private drain(): void {
    const now = Date.now();
    this.queue = this.queue.filter((item) => now - item.enqueuedAt < HATBOT_CADENCE.staleMs);
    if (now - this.lastBotAt < HATBOT_CADENCE.minBotGapMs || this.queue.length === 0) return;
    this.queue.sort((a, b) => b.priority - a.priority || a.enqueuedAt - b.enqueuedAt);
    const index = this.queue.findIndex(
      (item) => item.kind !== 'cta' || now - this.lastCtaAt >= HATBOT_CADENCE.ctaCooldownMs || this.lastCtaAt === 0,
    );
    if (index === -1) return;
    const [item] = this.queue.splice(index, 1);
    const message = item.build();
    if (!message) return;
    useCrowdStore.getState().add(message);
    this.lastBotAt = now;
    if (item.kind === 'cta') this.lastCtaAt = now;
    if (item.kind === 'login') this.loginPrompts += 1;
  }
}

let director: CrowdDirector | null = null;
let refCount = 0;

/** Ref-counted singleton — the live and duel dashboards can mount/unmount independently. */
export function startCrowdDirector(): () => void {
  refCount += 1;
  if (!director) {
    director = new CrowdDirector();
    director.start();
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    refCount -= 1;
    if (refCount <= 0 && director) {
      director.stop();
      director = null;
      refCount = 0;
    }
  };
}
