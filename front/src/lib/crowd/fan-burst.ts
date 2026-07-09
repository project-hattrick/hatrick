import { CrowdSource } from '@/enums/crowd-source.enum';
import { TeamSide } from '@/enums/team-side.enum';
import { crowdCountries, crowdAuthors, crowdTexts } from '@/config/crowd-pool.config';
import { crowdReactions, ambientTemplates, type ReactionContext } from '@/config/crowd-reactions.config';
import { buildReactionContext, eventSide } from '@/lib/crowd/reaction-context';
import type { CrowdMessage } from '@/types/crowd';
import type { LiveMatch, MatchEventPayload } from '@/types/match';

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** A fan message pinned to one side of the stands (~55% styled as ingested X posts). */
export function fanMessage(side: TeamSide, text: string): CrowdMessage {
  const pool = crowdCountries.filter((country) => country.side === side);
  const country = pick(pool.length > 0 ? pool : crowdCountries);
  return {
    id: crypto.randomUUID(),
    author: pick(crowdAuthors),
    side,
    countryCode: country.code,
    flag: country.flag,
    avatar: `https://i.pravatar.cc/64?img=${1 + Math.floor(Math.random() * 70)}`,
    text,
    ageLabel: 'now',
    source: Math.random() < 0.55 ? CrowdSource.Twitter : CrowdSource.Community,
  };
}

export interface StaggeredMessage {
  delayMs: number;
  message: CrowdMessage;
}

/** Burst size per event weight — goals get the loudest stands. */
const burstSize = (celebrateCount: number): number => Math.min(2 + Math.floor(Math.random() * 3), celebrateCount + 2);

/**
 * Team-aware reaction burst: the protagonist's fans celebrate, the other side laments,
 * with a sprinkle of neutrals — staggered so the chat feels human, not scripted.
 */
export function buildFanBurst(match: LiveMatch, event: MatchEventPayload): StaggeredMessage[] {
  const reactions = crowdReactions[event.action];
  if (!reactions) return [];
  const ctx = buildReactionContext(match, event);
  const side = eventSide(event);
  const otherSide = side === TeamSide.Home ? TeamSide.Away : TeamSide.Home;

  const candidates: Array<() => CrowdMessage> = [];
  reactions.celebrate.forEach((template) => candidates.push(() => fanMessage(side, template(ctx))));
  reactions.lament.forEach((template) => candidates.push(() => fanMessage(otherSide, template(ctx))));
  reactions.neutral.forEach((template) =>
    candidates.push(() => fanMessage(Math.random() < 0.5 ? side : otherSide, template(ctx))),
  );
  if (candidates.length === 0) return [];

  // Shuffle and take a small burst, spaced 300–1500ms apart.
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const size = Math.min(burstSize(reactions.celebrate.length), shuffled.length);
  let delayMs = 300;
  return shuffled.slice(0, size).map((build) => {
    const entry = { delayMs, message: build() };
    delayMs += 300 + Math.floor(Math.random() * 1200);
    return entry;
  });
}

/** One ambient chatter balloon — half generic pool, half contextual to the live scoreline. */
export function ambientFanMessage(match: LiveMatch | null): CrowdMessage {
  const side = Math.random() < 0.5 ? TeamSide.Home : TeamSide.Away;
  if (!match || Math.random() < 0.5) return fanMessage(side, pick(crowdTexts));
  const ctx: ReactionContext = buildReactionContext(match);
  return fanMessage(side, pick(ambientTemplates)(ctx));
}
