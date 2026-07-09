/** A player pinned to a pitch slot, or an open slot when name/rating are absent. */
export interface FormationSlot {
  /** % from the left edge of the pitch. */
  x: number;
  /** % from the top of the pitch (attack up top, keeper at the bottom). */
  y: number;
  /** Short tag rendered under the dot. */
  label: string;
  /** Filled player's display name (absent = open slot). */
  name?: string;
  /** Overall rating (absent = open slot). */
  rating?: number;
  /** Portrait shown inside the dot. */
  portraitSrc?: string;
  /** Gold ring for standout picks. */
  highlight?: boolean;
}

// Roster reused across every formation so ratings/portraits stay consistent on a swap.
// Fictional starter XI (avg ≈ 70) — no real-player names for licensing safety.
const P93 = '/cards/player-93.png';
const PGREEN = '/cards/player-green.png';
const PKEEPER = '/cards/player-keeper.png';

const roster = {
  duarte: { label: 'DUARTE', name: 'R. Duarte', rating: 74, portraitSrc: P93, highlight: true },
  mensah: { label: 'MENSAH', name: 'K. Mensah', rating: 72, portraitSrc: PGREEN },
  navarro: { label: 'NAVARRO', name: 'J. Navarro', rating: 71, portraitSrc: P93 },
  okafor: { label: 'OKAFOR', name: 'T. Okafor', rating: 70, portraitSrc: PGREEN },
  moreau: { label: 'MOREAU', name: 'L. Moreau', rating: 69, portraitSrc: P93 },
  petrov: { label: 'PETROV', name: 'S. Petrov', rating: 68, portraitSrc: PGREEN },
  costa: { label: 'COSTA', name: 'D. Costa', rating: 67, portraitSrc: P93 },
  weber: { label: 'WEBER', name: 'M. Weber', rating: 70, portraitSrc: PGREEN },
  rossi: { label: 'ROSSI', name: 'A. Rossi', rating: 69, portraitSrc: P93 },
  tanaka: { label: 'TANAKA', name: 'H. Tanaka', rating: 66, portraitSrc: PGREEN },
  kovac: { label: 'KOVAC', name: 'V. Kovac', rating: 73, portraitSrc: PKEEPER, highlight: true },
} as const;

export interface Formation {
  shape: string;
  filled: number;
  total: number;
  slots: FormationSlot[];
}

export const formations: Formation[] = [
  {
    shape: '4-3-3',
    filled: 11,
    total: 11,
    slots: [
      { ...roster.mensah, x: 20, y: 25 },
      { ...roster.duarte, x: 50, y: 22 },
      { ...roster.navarro, x: 80, y: 25 },
      { ...roster.okafor, x: 20, y: 40 },
      { ...roster.moreau, x: 50, y: 40 },
      { ...roster.petrov, x: 80, y: 40 },
      { ...roster.costa, x: 15, y: 63 },
      { ...roster.weber, x: 38, y: 63 },
      { ...roster.rossi, x: 62, y: 63 },
      { ...roster.tanaka, x: 85, y: 63 },
      { ...roster.kovac, x: 50, y: 86 },
    ],
  },
  {
    shape: '4-4-2',
    filled: 11,
    total: 11,
    slots: [
      { ...roster.duarte, x: 35, y: 24 },
      { ...roster.mensah, x: 65, y: 24 },
      { ...roster.navarro, x: 15, y: 40 },
      { ...roster.okafor, x: 38, y: 40 },
      { ...roster.moreau, x: 62, y: 40 },
      { ...roster.petrov, x: 85, y: 40 },
      { ...roster.costa, x: 15, y: 63 },
      { ...roster.weber, x: 38, y: 63 },
      { ...roster.rossi, x: 62, y: 63 },
      { ...roster.tanaka, x: 85, y: 63 },
      { ...roster.kovac, x: 50, y: 86 },
    ],
  },
  {
    shape: '3-4-3',
    filled: 11,
    total: 11,
    slots: [
      { ...roster.mensah, x: 20, y: 25 },
      { ...roster.duarte, x: 50, y: 22 },
      { ...roster.navarro, x: 80, y: 25 },
      { ...roster.okafor, x: 18, y: 40 },
      { ...roster.moreau, x: 44, y: 40 },
      { ...roster.petrov, x: 68, y: 40 },
      { ...roster.costa, x: 88, y: 40 },
      { ...roster.weber, x: 25, y: 63 },
      { ...roster.rossi, x: 50, y: 63 },
      { ...roster.tanaka, x: 75, y: 63 },
      { ...roster.kovac, x: 50, y: 86 },
    ],
  },
];

export interface RadarAxis {
  label: string;
  value: number;
}

/** Squad rating overview — headline number plus the five radar axes (clockwise from the top). */
export const squadAverage = {
  overall: 70,
  max: 100,
  radar: [
    { label: 'Attack', value: 72 },
    { label: 'Midfield', value: 69 },
    { label: 'Defense', value: 68 },
    { label: 'Chemistry', value: 71 },
    { label: 'Depth', value: 64 },
  ] satisfies RadarAxis[],
};

/** Squad chemistry — qualitative rating, the reason, and a 0–100 fill for the meter. */
export const chemistry = {
  rating: 'Medium',
  note: 'Young squad still gelling',
  value: 70,
};

export const dailyDuel = {
  you: 70,
  opponent: 69,
  opponentHandle: '@bleuforce',
};
