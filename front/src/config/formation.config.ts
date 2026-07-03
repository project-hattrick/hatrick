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
const P93 = '/cards/player-93.png';
const PGREEN = '/cards/player-green.png';
const PKEEPER = '/cards/player-keeper.png';

const roster = {
  mbappe: { label: 'MBAPPÉ', name: 'Mbappé', rating: 97, portraitSrc: P93, highlight: true },
  haaland: { label: 'HAALAND', name: 'Haaland', rating: 96, portraitSrc: PGREEN, highlight: true },
  messi: { label: 'MESSI', name: 'Messi', rating: 95, portraitSrc: P93 },
  bellingham: { label: 'BELLINGHAM', name: 'Bellingham', rating: 89, portraitSrc: PGREEN },
  rodri: { label: 'RODRI', name: 'Rodri', rating: 86, portraitSrc: P93 },
  dias: { label: 'DIAS', name: 'Dias', rating: 85, portraitSrc: PGREEN },
  hakimi: { label: 'HAKIMI', name: 'Hakimi', rating: 84, portraitSrc: P93 },
  alisson: { label: 'ALISSON', name: 'Alisson', rating: 88, portraitSrc: PKEEPER },
} as const;

const open = (label: string) => ({ label });

export interface Formation {
  shape: string;
  filled: number;
  total: number;
  slots: FormationSlot[];
}

export const formations: Formation[] = [
  {
    shape: '4-3-3',
    filled: 8,
    total: 11,
    slots: [
      { ...roster.mbappe, x: 20, y: 15 },
      { ...roster.haaland, x: 50, y: 12 },
      { ...roster.messi, x: 80, y: 15 },
      { ...roster.bellingham, x: 20, y: 40 },
      { ...roster.rodri, x: 50, y: 40 },
      { ...open('MEI'), x: 80, y: 40 },
      { ...roster.dias, x: 15, y: 63 },
      { ...roster.hakimi, x: 38, y: 63 },
      { ...open('ZAG'), x: 62, y: 63 },
      { ...open('LAT'), x: 85, y: 63 },
      { ...roster.alisson, x: 50, y: 86 },
    ],
  },
  {
    shape: '4-4-2',
    filled: 8,
    total: 11,
    slots: [
      { ...roster.mbappe, x: 35, y: 15 },
      { ...roster.haaland, x: 65, y: 15 },
      { ...roster.messi, x: 15, y: 40 },
      { ...roster.bellingham, x: 38, y: 40 },
      { ...roster.rodri, x: 62, y: 40 },
      { ...open('MEI'), x: 85, y: 40 },
      { ...roster.dias, x: 15, y: 63 },
      { ...roster.hakimi, x: 38, y: 63 },
      { ...open('ZAG'), x: 62, y: 63 },
      { ...open('LAT'), x: 85, y: 63 },
      { ...roster.alisson, x: 50, y: 86 },
    ],
  },
  {
    shape: '3-4-3',
    filled: 8,
    total: 11,
    slots: [
      { ...roster.mbappe, x: 20, y: 15 },
      { ...roster.haaland, x: 50, y: 12 },
      { ...roster.messi, x: 80, y: 15 },
      { ...roster.bellingham, x: 18, y: 40 },
      { ...roster.rodri, x: 44, y: 40 },
      { ...open('MEI'), x: 68, y: 40 },
      { ...open('LAT'), x: 88, y: 40 },
      { ...roster.dias, x: 25, y: 63 },
      { ...roster.hakimi, x: 50, y: 63 },
      { ...open('ZAG'), x: 75, y: 63 },
      { ...roster.alisson, x: 50, y: 86 },
    ],
  },
];

export interface StrengthLine {
  label: string;
  value: number;
}

export const teamStrength = {
  overall: 91,
  lines: [
    { label: 'Attack', value: 93 },
    { label: 'Midfield', value: 88 },
    { label: 'Defense', value: 90 },
  ] satisfies StrengthLine[],
  chemistry: 'High',
  chemistryNote: '3 from the same country',
};

export const dailyDuel = {
  you: 91,
  opponent: 89,
  opponentHandle: '@bleuforce',
};
