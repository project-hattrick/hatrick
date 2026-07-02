import { Role } from '../enums';

export interface FormationSlot {
  role: Role;
  lat: number;
  depth: number;
}

/** 11-a-side 4-3-3 shape (Blue fractions; mirrored for Red at spawn). */
export const FORMATION: FormationSlot[] = [
  { role: Role.GK, lat: 0.05, depth: 0.5 },
  { role: Role.DEF, lat: 0.2, depth: 0.16 },
  { role: Role.DEF, lat: 0.2, depth: 0.39 },
  { role: Role.DEF, lat: 0.2, depth: 0.61 },
  { role: Role.DEF, lat: 0.2, depth: 0.84 },
  { role: Role.MID, lat: 0.42, depth: 0.28 },
  { role: Role.MID, lat: 0.42, depth: 0.5 },
  { role: Role.MID, lat: 0.42, depth: 0.72 },
  { role: Role.ST, lat: 0.66, depth: 0.24 },
  { role: Role.ST, lat: 0.66, depth: 0.5 },
  { role: Role.ST, lat: 0.66, depth: 0.76 },
];
