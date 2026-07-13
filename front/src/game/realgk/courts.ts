import { FRANCE_STADIUM_FIELD } from './config';
import type { FieldSpec } from './field';

/** A selectable stadium: its own court PNG + its own field mapping (trapezoid / goals / lines). */
export interface CourtDef {
  key: string;
  label: string;
  /** `config.courtImage` — the painted court background. */
  png: string;
  /** Seed field limits for this court. `{}` = the field.ts rain-court defaults. */
  field: FieldSpec;
}

/** Sunset stadium seed (largest-green-component scan) — refine live in the /engine court editor. */
const SUNSET_FIELD: FieldSpec = {
  ratios: { topY: 0.339, bottomY: 0.705, topLeft: 0.264, topRight: 0.729, bottomLeft: 0.144, bottomRight: 0.857 },
};

/** The courts that ship with a PNG + mapping. Single source for the /engine court dropdown + editor seed. */
export const COURTS: CourtDef[] = [
  { key: 'rain', label: 'Rain court', png: '/game/stadiums/rain-court/court.png', field: {} },
  { key: 'franca', label: 'France night stadium', png: '/game/franca/court.png', field: FRANCE_STADIUM_FIELD },
  { key: 'sunset', label: 'Sunset stadium', png: '/game/stadiums/sunset-court/court.png', field: SUNSET_FIELD },
];

export const courtByKey = (key: string): CourtDef => COURTS.find((c) => c.key === key) ?? COURTS[0];
