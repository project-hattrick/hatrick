import { EmissionState } from '@/enums/emission-state.enum';
import { MatchAction } from '@/enums/match-action.enum';
import { GameState } from '@/enums/game-state.enum';
import { MarketType } from '@/enums/market-type.enum';
import { PredictionStatus } from '@/enums/prediction-status.enum';
import { TeamSide } from '@/enums/team-side.enum';
import { CrowdSource } from '@/enums/crowd-source.enum';
import type { LiveMatch, MatchEventPayload } from '@/types/match';
import type { CrowdMessage } from '@/types/crowd';
import type { Prediction, PredictionPrompt } from '@/types/prediction';
import { useMatchStore } from '@/store/match.store';
import { useCrowdStore } from '@/store/crowd.store';
import { usePredictionStore } from '@/store/prediction.store';
import { crowdCountries, crowdAuthors, crowdTexts } from '@/config/crowd-pool.config';

export const MOCK_FIXTURE_ID = 1001;

const seedMatch: LiveMatch = {
  fixtureId: MOCK_FIXTURE_ID,
  home: { side: TeamSide.Home, code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  away: { side: TeamSide.Away, code: 'FRA', name: 'France', flag: '🇫🇷' },
  score: { home: 0, away: 0 },
  minute: 67,
  gameState: GameState.SecondHalf,
};

function pastEvent(
  seq: number,
  minute: number,
  action: MatchAction,
  participant: number,
  label: string,
): MatchEventPayload {
  return { fixtureId: MOCK_FIXTURE_ID, action, state: EmissionState.After, confirmed: true, seq, ts: 0, minute, participant, label };
}

const seedEvents: MatchEventPayload[] = [
  pastEvent(1, 23, MatchAction.Goal, 1, 'ARG-10'),
  pastEvent(2, 41, MatchAction.Corner, 2, 'France'),
  pastEvent(3, 54, MatchAction.Goal, 2, 'FRA-10'),
  pastEvent(4, 67, MatchAction.Goal, 1, 'ARG-10'),
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** A randomly assembled fan message (author, country flag, avatar, text). */
export function randomCrowdMessage(): CrowdMessage {
  const country = pick(crowdCountries);
  return {
    id: crypto.randomUUID(),
    author: pick(crowdAuthors),
    side: country.side,
    countryCode: country.code,
    flag: country.flag,
    avatar: `https://i.pravatar.cc/64?img=${1 + Math.floor(Math.random() * 70)}`,
    text: pick(crowdTexts),
    ageLabel: 'now',
    source: Math.random() < 0.55 ? CrowdSource.Twitter : CrowdSource.Community,
  };
}

const seedAges = ['2m', '1m', '40s', '25s', '15s', '8s', '3s', 'now'];

function buildMessages(): CrowdMessage[] {
  return seedAges.map((ageLabel) => ({ ...randomCrowdMessage(), ageLabel }));
}

function buildPredictions(): Prediction[] {
  return [
    { id: crypto.randomUUID(), market: MarketType.NextGoal, label: 'Next goal: YES', status: PredictionStatus.Pending, points: 50 },
    { id: crypto.randomUUID(), market: MarketType.Corners, label: '+2.5 corners', status: PredictionStatus.Won, points: 30 },
  ];
}

const seedPrompt: PredictionPrompt = {
  id: 'prompt-next-goal',
  question: 'Will there be a Goal?',
  market: MarketType.NextGoal,
  yesPoints: 50,
  noPoints: 10,
  secondsLeft: 45,
  yesOdds: 1.9,
  noOdds: 2.1,
};

/** Hydrates every store with a believable live match (idempotent). */
export function hydrateFromMock(): void {
  const match = useMatchStore.getState();
  match.setMatch(seedMatch);
  seedEvents.forEach((event) => match.applyEvent(event));
  useCrowdStore.getState().seed(buildMessages());
  const prediction = usePredictionStore.getState();
  prediction.seed(buildPredictions());
  prediction.setPrompt(seedPrompt);
}

interface ScriptedEvent {
  action: MatchAction;
  participant: number;
  label: string;
}

/** One believable stretch of second-half drama, then a non-scoring loop (score stays sane). */
const eventScript: ScriptedEvent[] = [
  { action: MatchAction.Corner, participant: 2, label: 'France' },
  { action: MatchAction.YellowCard, participant: 1, label: 'ARG-5' },
  { action: MatchAction.Goal, participant: 2, label: 'FRA-10' },
  { action: MatchAction.Var, participant: 2, label: 'Goal check' },
  { action: MatchAction.Penalty, participant: 1, label: 'Argentina' },
  { action: MatchAction.Goal, participant: 1, label: 'ARG-10' },
];

const eventLoop: ScriptedEvent[] = [
  { action: MatchAction.Corner, participant: 1, label: 'Argentina' },
  { action: MatchAction.FreeKick, participant: 2, label: 'FRA-8' },
  { action: MatchAction.Substitution, participant: 2, label: 'FRA-9' },
  { action: MatchAction.YellowCard, participant: 2, label: 'FRA-6' },
  { action: MatchAction.Corner, participant: 2, label: 'France' },
  { action: MatchAction.FreeKick, participant: 1, label: 'ARG-10' },
];

const MOCK_EVENT_INTERVAL_MS = 20_000;

/**
 * Simulated match feed — emits one scripted event every ~20s through the same
 * `applyEvent` seam the real socket uses, so everything downstream (score, stats,
 * crowd director) behaves identically in mock mode.
 */
export function startMockMatchEvents(): () => void {
  let seq = seedEvents.length;
  let step = 0;
  const timer = setInterval(() => {
    const scripted = step < eventScript.length ? eventScript[step] : eventLoop[(step - eventScript.length) % eventLoop.length];
    step += 1;
    seq += 1;
    const state = useMatchStore.getState();
    const minute = Math.min((state.match?.minute ?? 67) + 2, 90);
    state.applyEvent({
      fixtureId: MOCK_FIXTURE_ID,
      action: scripted.action,
      state: EmissionState.After,
      confirmed: true,
      seq,
      ts: Date.now(),
      minute,
      participant: scripted.participant,
      label: scripted.label,
    });
  }, MOCK_EVENT_INTERVAL_MS);
  return () => clearInterval(timer);
}
