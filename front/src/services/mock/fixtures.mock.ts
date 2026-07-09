import type { FixtureDto } from '@/services/txline.service';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';

/** One hour in seconds — for spacing the mock kickoff times. */
const HOUR = 3_600;
/** Fixed reference epoch (seconds) so the list is deterministic without Date at module load. */
const NOW = 1_782_000_000;

/**
 * Mock fixtures for the Live board. The first is the live match wired to the
 * home feed (MOCK_FIXTURE_ID = ARG vs FRA); the rest are upcoming.
 */
export const MOCK_FIXTURES: FixtureDto[] = [
  { FixtureId: MOCK_FIXTURE_ID, Participant1: 'Argentina', Participant2: 'France', StartTime: NOW - HOUR },
  { FixtureId: 1002, Participant1: 'England', Participant2: 'Norway', StartTime: NOW + 4 * HOUR },
  { FixtureId: 1003, Participant1: 'Belgium', Participant2: 'Morocco', StartTime: NOW + 28 * HOUR },
  { FixtureId: 1004, Participant1: 'Spain', Participant2: 'Switzerland', StartTime: NOW + 52 * HOUR },
];
