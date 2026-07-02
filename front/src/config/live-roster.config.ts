/** Players that can hold the ball in the live hero focus card. */
export interface FocusPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  code: string;
  rating: number;
  pass: string;
  touches: number;
  goals: number;
  onBall: boolean;
  /** Pixel-art portrait in /public/cards. */
  portraitSrc: string;
}

export const liveRoster: FocusPlayer[] = [
  { id: 'messi', name: 'L. Messi', team: 'Argentina', position: 'RW', code: 'RED-5', rating: 95, pass: '87%', touches: 54, goals: 2, onBall: true, portraitSrc: '/cards/player-93.png' },
  { id: 'alvarez', name: 'J. Álvarez', team: 'Argentina', position: 'ST', code: 'RED-9', rating: 88, pass: '79%', touches: 41, goals: 1, onBall: false, portraitSrc: '/cards/player-keeper.png' },
  { id: 'mbappe', name: 'K. Mbappé', team: 'France', position: 'ST', code: 'BLU-10', rating: 97, pass: '82%', touches: 60, goals: 1, onBall: false, portraitSrc: '/cards/player-green.png' },
  { id: 'griezmann', name: 'A. Griezmann', team: 'France', position: 'CAM', code: 'BLU-7', rating: 89, pass: '90%', touches: 66, goals: 0, onBall: false, portraitSrc: '/cards/player-93.png' },
];

/** Positive modulo so prev/next wrap cleanly around the roster. */
export function focusAt(index: number): { player: FocusPlayer; position: number; total: number } {
  const total = liveRoster.length;
  const wrapped = ((index % total) + total) % total;
  return { player: liveRoster[wrapped], position: wrapped + 1, total };
}
