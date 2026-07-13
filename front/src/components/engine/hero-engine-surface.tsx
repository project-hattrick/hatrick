'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { RealGkBackground } from '@/components/game/real-gk/real-gk-background';
import { REAL_GK_MATCH_CONFIG, type RealGkFeatures } from '@/game/realgk/config';
import { buildRealGkFixtureConfig } from '@/game/realgk/fixture-config';
import { COURTS, courtByKey } from '@/game/realgk/courts';
import type { RealGkHandle } from '@/game/realgk/types';
import {
  buildSnippet,
  fieldSpecFromState,
  stateFromFieldSpec,
  type CalibratorState,
} from '@/components/aligner/field-calibrator-data';
import { FloatingWidget } from './floating-widget';
import { CourtCalibrationOverlay, type Fit } from './court-calibration-overlay';

interface TeamOption {
  key: string;
  name: string;
  code: string;
}

/** The nations whose recolored packs ship (fixture-config `CODE_TO_PACK`); France = the home default. */
const TEAMS: TeamOption[] = [
  { key: 'france', name: 'France', code: 'FRA' },
  { key: 'netherlands', name: 'Netherlands', code: 'NED' },
  { key: 'brazil', name: 'Brazil', code: 'BRA' },
  { key: 'argentina', name: 'Argentina', code: 'ARG' },
  { key: 'spain', name: 'Spain', code: 'ESP' },
  { key: 'norway', name: 'Norway', code: 'NOR' },
  { key: 'england', name: 'England', code: 'ENG' },
  { key: 'switzerland', name: 'Switzerland', code: 'SUI' },
];
const teamByKey = (k: string): TeamOption => TEAMS.find((t) => t.key === k) ?? TEAMS[0];
const SPEED_CYCLE = [1, 2, 3] as const;

const selectCls = 'rounded-md border border-white/15 bg-black/40 px-2 py-1 text-sm text-white outline-none focus:border-sky-400';
const btnCls = 'rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-40';

/** The home hero's mock match, fullscreen, with team + live court editing widgets. Dev-only surface. */
export function HeroEngineSurface() {
  const [blueKey, setBlueKey] = useState('france');
  const [redKey, setRedKey] = useState('netherlands');
  const [courtKey, setCourtKey] = useState('franca');
  const [heroLook, setHeroLook] = useState(false);
  const [editing, setEditing] = useState(false);
  const [calState, setCalState] = useState<CalibratorState | null>(null);
  const [fit, setFit] = useState<Fit | null>(null);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const handleRef = useRef<RealGkHandle | null>(null);

  const blue = teamByKey(blueKey);
  const red = teamByKey(redKey);
  const court = courtByKey(courtKey);

  // Rebuilding this object reboots the engine (RealGkBackground keys its boot effect on `config`).
  const config = useMemo(() => {
    if (heroLook) return REAL_GK_MATCH_CONFIG;
    const built = buildRealGkFixtureConfig(
      { name: blue.name, code: blue.code },
      { name: red.name, code: red.code },
      { png: court.png, field: court.field },
    ).config;
    // Engine-only: smart football AI + full-pitch opening live HERE, not on the shared persona/room config.
    return { ...built, features: { ...(built.features as RealGkFeatures), smartAI: true, openingFullPitch: true } };
  }, [heroLook, blue, red, court]);

  // Any reboot (team / court / hero swap) drops calibration mode so the overlay never binds a dead engine.
  const setBlue = (v: string) => { setEditing(false); setBlueKey(v); };
  const setRed = (v: string) => { setEditing(false); setRedKey(v); };
  const setCourt = (v: string) => { setEditing(false); setCourtKey(v); };
  const setHero = (v: boolean) => { setEditing(false); setHeroLook(v); };

  const onReady = useCallback((handle: RealGkHandle | null) => {
    handleRef.current = handle;
    if (handle) {
      setPaused(false);
      setSpeed(1);
    }
  }, []);

  // Edit mode: pin the camera and poll the pinned court rect (setFit runs in the rAF callback, not the
  // effect body). The editor state is seeded in `toggleEdit` when the mode turns on.
  useEffect(() => {
    const handle = handleRef.current;
    if (!editing || !handle) return;
    handle.setCalibrationView(true);
    let raf = 0;
    const tick = () => {
      setFit(handle.calibrationFit());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      handle.setCalibrationView(false);
      setFit(null);
    };
  }, [editing]);

  const toggleEdit = () => {
    if (!editing) setCalState(stateFromFieldSpec(heroLook ? {} : court.field));
    setEditing((v) => !v);
  };

  const applyCal = useCallback((next: CalibratorState) => {
    setCalState(next);
    handleRef.current?.setField(fieldSpecFromState(next));
  }, []);

  const swapSides = () => {
    setEditing(false);
    setBlueKey(redKey);
    setRedKey(blueKey);
  };
  const togglePause = () => {
    handleRef.current?.togglePause();
    setPaused((p) => !p);
  };
  const cycleSpeed = () => {
    handleRef.current?.cycleSpeed();
    setSpeed((s) => SPEED_CYCLE[(SPEED_CYCLE.indexOf(s as 1 | 2 | 3) + 1) % SPEED_CYCLE.length]);
  };
  const exportField = () => {
    if (!calState) return;
    const snippet = buildSnippet(calState);
    console.info(snippet); // recoverable even if the clipboard is blocked
    navigator.clipboard?.writeText(snippet).then(
      () => toast.success('Copied field config to clipboard'),
      () => toast.error('Clipboard blocked — copied to the console instead'),
    );
  };
  const resetField = () => {
    const seed = stateFromFieldSpec(heroLook ? {} : court.field);
    setCalState(seed);
    handleRef.current?.setField(fieldSpecFromState(seed));
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <RealGkBackground config={config} onReady={onReady} teamNames={{ blue: blue.name, red: red.name }} />

      {editing && fit && calState ? <CourtCalibrationOverlay fit={fit} state={calState} onChange={applyCal} /> : null}

      <FloatingWidget title="Teams" className="left-4 top-4">
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-[11px] text-white/60">
            Blue
            <select className={selectCls} value={blueKey} disabled={heroLook} onChange={(e) => setBlue(e.target.value)}>
              {TEAMS.map((t) => (
                <option key={t.key} value={t.key}>{t.name}</option>
              ))}
            </select>
          </label>
          <button className={btnCls} onClick={swapSides} disabled={heroLook} title="Swap sides">⇄</button>
          <label className="flex flex-col gap-1 text-[11px] text-white/60">
            Red
            <select className={selectCls} value={redKey} disabled={heroLook} onChange={(e) => setRed(e.target.value)}>
              {TEAMS.map((t) => (
                <option key={t.key} value={t.key}>{t.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-2 flex items-center gap-2 text-[11px] text-white/70">
          <input type="checkbox" checked={heroLook} onChange={(e) => setHero(e.target.checked)} className="accent-sky-400" />
          Hero look (generic, no kits)
        </label>
      </FloatingWidget>

      <FloatingWidget title="Court" className="right-4 top-4">
        <div className="flex items-center gap-2">
          <select className={selectCls} value={courtKey} disabled={heroLook} onChange={(e) => setCourt(e.target.value)}>
            {COURTS.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <button className={btnCls} onClick={toggleEdit} disabled={heroLook}>
            {editing ? 'Done' : 'Edit court'}
          </button>
        </div>
        {editing ? (
          <div className="mt-2 flex items-center gap-2">
            <button className={btnCls} onClick={exportField}>Export</button>
            <button className={btnCls} onClick={resetField}>Reset</button>
            <span className="text-[11px] text-white/40">drag the handles</span>
          </div>
        ) : null}
      </FloatingWidget>

      <FloatingWidget title="Playback" className="bottom-4 left-4">
        <div className="flex items-center gap-2">
          <button className={btnCls} onClick={() => handleRef.current?.restart()}>Restart</button>
          <button className={btnCls} onClick={togglePause}>{paused ? 'Play' : 'Pause'}</button>
          <button className={btnCls} onClick={cycleSpeed}>{speed}×</button>
        </div>
      </FloatingWidget>
    </div>
  );
}
