import type { Formation } from '../core/types';
import { Role } from '../enums';
import type { Corners } from '../math/homography';

/** Perspective corners for the shared rain-court stadium image (canvas fractions). */
export const RAIN_COURT_CORNERS: Corners = {
  TL: [0.218, 0.346],
  TR: [0.782, 0.346],
  BR: [0.884, 0.708],
  BL: [0.116, 0.708],
};

/** Reusable football shapes; spawn mirrors them for the Red side. [role, depth, width] (Blue fractions). */
export const STANDARD_FORMATIONS: Formation[] = [
  [
    [Role.GK, 0.05, 0.5],
    [Role.DEF, 0.17, 0.18],
    [Role.DEF, 0.17, 0.4],
    [Role.DEF, 0.17, 0.6],
    [Role.DEF, 0.17, 0.82],
    [Role.MID, 0.36, 0.2],
    [Role.MID, 0.36, 0.43],
    [Role.MID, 0.36, 0.57],
    [Role.MID, 0.36, 0.8],
    [Role.FWD, 0.5, 0.36],
    [Role.FWD, 0.5, 0.64],
  ],
  [
    [Role.GK, 0.05, 0.5],
    [Role.DEF, 0.17, 0.16],
    [Role.DEF, 0.17, 0.38],
    [Role.DEF, 0.17, 0.62],
    [Role.DEF, 0.17, 0.84],
    [Role.MID, 0.35, 0.28],
    [Role.MID, 0.35, 0.5],
    [Role.MID, 0.35, 0.72],
    [Role.FWD, 0.53, 0.22],
    [Role.FWD, 0.53, 0.5],
    [Role.FWD, 0.53, 0.78],
  ],
  [
    [Role.GK, 0.05, 0.5],
    [Role.DEF, 0.18, 0.25],
    [Role.DEF, 0.18, 0.5],
    [Role.DEF, 0.18, 0.75],
    [Role.MID, 0.36, 0.15],
    [Role.MID, 0.36, 0.4],
    [Role.MID, 0.36, 0.6],
    [Role.MID, 0.36, 0.85],
    [Role.FWD, 0.54, 0.25],
    [Role.FWD, 0.54, 0.5],
    [Role.FWD, 0.54, 0.75],
  ],
  [
    [Role.GK, 0.05, 0.5],
    [Role.DEF, 0.16, 0.18],
    [Role.DEF, 0.16, 0.4],
    [Role.DEF, 0.16, 0.6],
    [Role.DEF, 0.16, 0.82],
    [Role.MID, 0.3, 0.35],
    [Role.MID, 0.3, 0.65],
    [Role.MID, 0.44, 0.22],
    [Role.MID, 0.44, 0.5],
    [Role.MID, 0.44, 0.78],
    [Role.FWD, 0.57, 0.5],
  ],
];
