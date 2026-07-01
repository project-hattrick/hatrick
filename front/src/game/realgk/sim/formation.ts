import { Role } from '../enums';

export interface FormationSlot {
  role: Role;
  lat: number;
  depth: number;
}

/** 5-a-side shape (Blue fractions; mirrored for Red at spawn). */
export const FORMATION: FormationSlot[] = [
  { role: Role.GK, lat: 0.055, depth: 0.5 },
  { role: Role.DEF, lat: 0.22, depth: 0.3 },
  { role: Role.DEF, lat: 0.22, depth: 0.7 },
  { role: Role.MID, lat: 0.47, depth: 0.5 },
  { role: Role.ST, lat: 0.69, depth: 0.5 },
];
