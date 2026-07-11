import Link from 'next/link';

import { BillboardEditor } from '@/components/aligner/billboard-editor';
import type { Billboard } from '@/game/realgk/billboards';
import { FRANCE_BILLBOARDS } from '@/game/realgk/config';

export const metadata = {
  title: 'Billboard Editor — Hat-trick',
};

interface CourtPreset {
  label: string;
  src: string;
  storageKey?: string;
  initial?: Billboard[];
}

/** Courts whose LED/ad boards can be retuned — each keeps its own auto-saved session and opens on
 *  the placements the engine currently uses for that court. */
const COURTS: Record<string, CourtPreset> = {
  rain: { label: 'Rain court (v1)', src: '/game/stadiums/rain-court/court.png' },
  franca: {
    label: 'France night stadium',
    src: '/game/franca/court.png',
    storageKey: 'hat-trick:billboard-editor:franca:v1',
    initial: FRANCE_BILLBOARDS,
  },
  sunset: {
    label: 'Sunset stadium',
    src: '/game/stadiums/sunset-court/court.png',
    storageKey: 'hat-trick:billboard-editor:sunset:v1',
  },
};

/** Dev tool: place/drag advertiser panels (image + LED) over the real pitch, then export the ratios. */
export default async function BillboardEditorPage({ searchParams }: { searchParams: Promise<{ court?: string }> }) {
  const { court } = await searchParams;
  const active = court && COURTS[court] ? court : 'rain';
  const preset = COURTS[active];
  return (
    <main className="min-h-screen bg-background">
      {/* Stadium picker — same courts as /sandbox/field-calibrator, session saved per court. */}
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
      <BillboardEditor key={active} courtSrc={preset.src} storageKey={preset.storageKey} initial={preset.initial} />
    </main>
  );
}
