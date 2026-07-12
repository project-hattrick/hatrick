import Link from 'next/link';

import { FieldCalibrator } from '@/components/aligner/field-calibrator';
import { stateFromFieldSpec, type CalibratorState } from '@/components/aligner/field-calibrator-data';
import { FRANCE_STADIUM_FIELD } from '@/game/realgk/config';
import type { FieldSpec } from '@/game/realgk/field';

export const metadata = {
  title: 'Field Calibrator — Hat-trick',
};

/** Sunset stadium grass trapezoid (largest-green-component scan) — seed only; refine by dragging. */
const SUNSET_FIELD: FieldSpec = {
  ratios: { topY: 0.339, bottomY: 0.705, topLeft: 0.264, topRight: 0.729, bottomLeft: 0.144, bottomRight: 0.857 },
};

interface CourtPreset {
  label: string;
  src: string;
  storageKey?: string;
  initial?: CalibratorState;
}

/** Courts the calibrator can map — each keeps its own saved trace and opens on the court's CURRENT
 *  in-game mapping (`initial`), so editing a new stadium starts from what the engine already uses. */
const COURTS: Record<string, CourtPreset> = {
  rain: { label: 'Rain court — home / live / room', src: '/game/stadiums/rain-court/court.png' },
  franca: {
    label: 'France night stadium',
    src: '/game/franca/court.png',
    storageKey: 'hat-trick:field-calibrator:franca:v2',
    initial: stateFromFieldSpec(FRANCE_STADIUM_FIELD),
  },
  sunset: {
    label: 'Sunset stadium',
    src: '/game/stadiums/sunset-court/court.png',
    storageKey: 'hat-trick:field-calibrator:sunset:v2',
    initial: stateFromFieldSpec(SUNSET_FIELD),
  },
};

/** Dev tool: trace the court's playable trapezoid + goals and read back the metrics() ratios. */
export default async function FieldCalibratorPage({ searchParams }: { searchParams: Promise<{ court?: string }> }) {
  const { court } = await searchParams;
  const active = court && COURTS[court] ? court : 'rain';
  const preset = COURTS[active];
  return (
    <main className="min-h-screen bg-background">
      {/* Stadium picker: the courts we ship, rendered — click to remap another one (trace saved per court). */}
      <div className="mx-auto flex max-w-[1280px] flex-wrap gap-3 px-6 pt-6">
        {Object.entries(COURTS).map(([key, c]) => (
          <Link
            key={key}
            href={`?court=${key}`}
            className={`group w-44 overflow-hidden rounded-lg border-2 transition-colors ${
              key === active ? 'border-sky-400' : 'border-slate-700 hover:border-slate-500'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- dev tool thumbnail, plain asset */}
            <img src={c.src} alt={c.label} className="aspect-video w-full object-cover" />
            <div className={`px-2 py-1 text-xs font-medium ${key === active ? 'bg-sky-400 text-black' : 'bg-slate-800 text-slate-300'}`}>
              {c.label}
            </div>
          </Link>
        ))}
      </div>
      <FieldCalibrator key={active} courtSrc={preset.src} storageKey={preset.storageKey} initial={preset.initial} />
    </main>
  );
}
