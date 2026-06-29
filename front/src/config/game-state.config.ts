import { GameState } from '@/enums/game-state.enum';

interface GameStateMeta {
  label: string;
  short: string;
}

export const gameStateConfig: Record<GameState, GameStateMeta> = {
  [GameState.PreMatch]: { label: 'Pre-Match', short: 'PRE' },
  [GameState.FirstHalf]: { label: '1st Half', short: '1H' },
  [GameState.HalfTime]: { label: 'Half-Time', short: 'HT' },
  [GameState.SecondHalf]: { label: '2nd Half', short: '2H' },
  [GameState.ExtraTime]: { label: 'Extra Time', short: 'ET' },
  [GameState.FullTime]: { label: 'Full-Time', short: 'FT' },
  [GameState.Unknown]: { label: '—', short: '—' },
};

export const gameStateFallback: GameStateMeta = gameStateConfig[GameState.Unknown];
