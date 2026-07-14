'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { RealGkBackground } from '@/components/game/real-gk/real-gk-background';
import { REAL_GK_MATCH_CONFIG, type RealGkFeatures } from '@/game/realgk/config';
import { buildRealGkFixtureConfig } from '@/game/realgk/fixture-config';
import { loadRealGkAssets } from '@/game/realgk/assets/loader';
import { COURTS, courtByKey } from '@/game/realgk/courts';
import { Team } from '@/game/realgk/enums';
import type { RealGkHandle, RealGkRadar } from '@/game/realgk/types';
import { EngineMinimap } from './engine-minimap';
import { EngineScoreboard } from './engine-scoreboard';
import {
  buildSnippet,
  fieldSpecFromState,
  stateFromFieldSpec,
  type CalibratorState,
} from '@/components/aligner/field-calibrator-data';
import { useReplayCatalog } from '@/services/queries/use-replay';
import { useLoadReplay } from '@/hooks/use-load-replay';
import { useRealgkFeedDriver } from '@/services/realtime/use-realgk-driver';
import { replayService } from '@/services/replay.service';
import { useMatchStore } from '@/store/match.store';
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
  const [radar, setRadar] = useState<RealGkRadar | null>(null);
  const [ready, setReady] = useState(false);
  const handleRef = useRef<RealGkHandle | null>(null);

  // Poll the live positions a few times a second for the minimap (mirrors the actual on-pitch dots + ball).
  useEffect(() => {
    const id = window.setInterval(() => {
      const handle = handleRef.current;
      setRadar(handle ? handle.sampleRadar() : null);
    }, 90);
    return () => window.clearInterval(id);
  }, []);

  const blue = teamByKey(blueKey);
  const red = teamByKey(redKey);
  const court = courtByKey(courtKey);

  // Real-match mode: stream a finished TxLINE fixture through the backend (`POST /replay`) and drive the
  // engine off it, exactly like the room. Needs NEXT_PUBLIC_USE_MOCK=false + the API/socket up. When no
  // replay is active the engine stays on the autonomous mock. Name/code are read as primitives (not the
  // match object) so a per-minute feed tick never reboots the engine.
  const { data: replayCatalog } = useReplayCatalog(6);
  const { loadReplay } = useLoadReplay();
  const isReplay = useMatchStore((s) => s.isReplay);
  const feedHomeName = useMatchStore((s) => s.match?.home.name);
  const feedHomeCode = useMatchStore((s) => s.match?.home.code);
  const feedAwayName = useMatchStore((s) => s.match?.away.name);
  const feedAwayCode = useMatchStore((s) => s.match?.away.code);
  const drivenFixtureId = useMatchStore((s) => (s.isReplay ? s.match?.fixtureId ?? null : null));
  const replayNonce = useMatchStore((s) => s.replayNonce);

  // Effective teams the engine renders: the feed's while replaying, else the manual dropdowns.
  const bName = isReplay && feedHomeName ? feedHomeName : blue.name;
  const bCode = isReplay && feedHomeCode ? feedHomeCode : blue.code;
  const rName = isReplay && feedAwayName ? feedAwayName : red.name;
  const rCode = isReplay && feedAwayCode ? feedAwayCode : red.code;

  // Rebuilding this object reboots the engine (RealGkBackground keys its boot effect on `config`).
  const config = useMemo(() => {
    if (heroLook) return REAL_GK_MATCH_CONFIG;
    const built = buildRealGkFixtureConfig(
      { name: bName, code: bCode },
      { name: rName, code: rCode },
      { png: court.png, field: court.field, billboards: court.billboards },
    ).config;
    // Engine-only: smart football AI + full-pitch opening + a WIDE framing so the whole pitch (far-
    // touchline ad boards at the top AND the play) reads at once, with only a small upward lift so the
    // play sits centered — a tight zoom + big lift crammed it at the bottom. Set HERE, not on the shared
    // persona/room config.
    return {
      ...built,
      cameraLift: 0.06,
      presets: [
        { label: 'Broadcast', zoom: 0.7, follow: true },
        { label: 'Close', zoom: 1.05, follow: true },
        { label: 'Wide', zoom: 0.56, follow: false },
        { label: 'Full pitch', zoom: 0.54, follow: false },
      ],
      // `extraAnims` unlocks headers (aerial duels), first touches, interceptions + agile turn/brake so the
      // match actually USES every mechanic; smartAI + the full-pitch opening are engine-only too. Keep
      // `matchIntro` ON (inherited) so switching teams/court replays the pre-match showcase + walk-on +
      // kickoff arrangement — the loading veil covers the cold-asset flash before it. `drivenFiller` is OFF
      // while replaying a REAL match so NO autonomous shots-on-goal fire — shots come ONLY from the feed;
      // the mock keeps it on for liveliness (irrelevant there since the mock isn't feed-driven anyway).
      features: {
        ...(built.features as RealGkFeatures),
        smartAI: true,
        openingFullPitch: true,
        extraAnims: true,
        quickIntro: true,
        drivenFiller: !isReplay,
      },
    };
  }, [heroLook, bName, bCode, rName, rCode, court, isReplay]);

  // Drive the engine off the chosen replay's feed (null fixtureId → autonomous mock). Same hook the room
  // uses; `cinematicIntro: false` drops straight in, `resetKey` re-arms on a replay restart.
  useRealgkFeedDriver(handleRef, drivenFixtureId, { cinematicIntro: false, resetKey: replayNonce });

  const stopReplay = () => {
    void replayService.stop().catch(() => {});
    useMatchStore.setState({ match: null, isReplay: false });
  };

  // Hide the match behind a loading veil until the court PNG + sprite atlases are actually decoded — else
  // the first boot flashes a black pitch with only foot-rings/LED boards while the images stream in. This
  // shares the engine's image cache (`loadRealGkAssets` caches by src), so it just waits on the same
  // requests. `setReady(true)` runs in a callback (not the effect body) so it stays cheap and rule-clean.
  useEffect(() => {
    const assets = loadRealGkAssets(
      config.features !== undefined,
      config.features?.personaHeads === true,
      config.personaBodyRoot,
      config.courtImage,
      config.assetVersion,
      config.personaBodyRootAway,
      config.assetVersionAway,
    );
    const images: HTMLImageElement[] = [];
    const collect = (node: unknown): void => {
      if (node instanceof HTMLImageElement) images.push(node);
      else if (Array.isArray(node)) node.forEach(collect);
      else if (node && typeof node === 'object') Object.values(node).forEach(collect);
    };
    collect(assets);
    const settled = (img: HTMLImageElement): Promise<void> =>
      img.complete
        ? Promise.resolve()
        : new Promise((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          });
    let cancelled = false;
    const cap = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 10000); // never trap the veil on a stalled asset (heavier atlases with extraAnims load slower cold)
    void Promise.all(images.map(settled)).then(() => {
      if (cancelled) return;
      window.clearTimeout(cap);
      setReady(true);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(cap);
    };
  }, [config]);

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
  // Force a real event on the running match + a screen toast so pressing the button always shows something.
  const spawn = (kind: Parameters<RealGkHandle['debugEvent']>[0], team: Team, label: string) => {
    handleRef.current?.debugEvent(kind, team);
    toast(label);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <RealGkBackground config={config} onReady={onReady} bridgeHud teamNames={{ blue: bName, red: rName }} />

      {/* Loading veil — covers the black first-boot flash until the court + sprites are decoded. */}
      {!ready ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black">
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            Loading pitch…
          </div>
        </div>
      ) : null}

      {editing && fit && calState ? <CourtCalibrationOverlay fit={fit} state={calState} onChange={applyCal} /> : null}

      <EngineMinimap radar={radar} className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2" />

      {/* Broadcast scoreboard — score/clock update on goals, event beats surface, like the main screen. */}
      {ready ? <EngineScoreboard className="absolute left-1/2 top-3 z-20 -translate-x-1/2" /> : null}

      <FloatingWidget title="Real match (API)" className="left-4 top-[148px]">
        {isReplay ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-white/80">{feedHomeName} v {feedAwayName}</span>
            <button className={btnCls} onClick={stopReplay}>Back to mock</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <select
              className={selectCls}
              value=""
              disabled={heroLook}
              onChange={(e) => {
                const f = replayCatalog?.find((c) => String(c.fixtureId) === e.target.value);
                if (f) void loadReplay(f, 1);
              }}
            >
              <option value="">Load a past match…</option>
              {replayCatalog?.map((c) => (
                <option key={c.fixtureId} value={c.fixtureId}>{c.home} v {c.away}</option>
              ))}
            </select>
            {!replayCatalog?.length ? <span className="text-[11px] text-white/40">API off / no fixtures</span> : null}
          </div>
        )}
      </FloatingWidget>

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

      <FloatingWidget title="Spawn event" className="bottom-4 right-4">
        <div className="flex max-w-[260px] flex-wrap gap-1.5">
          <button className={btnCls} onClick={() => spawn('goal', Team.Blue, `⚽ Goal — ${blue.name}`)}>Goal</button>
          <button className={btnCls} onClick={() => spawn('shot', Team.Blue, `Shot — ${blue.name}`)}>Shot</button>
          <button className={btnCls} onClick={() => spawn('corner', Team.Blue, `Corner — ${blue.name}`)}>Corner</button>
          <button className={btnCls} onClick={() => spawn('card', Team.Red, `🟨 Yellow card — ${red.name}`)}>Card</button>
          <button className={btnCls} onClick={() => spawn('red', Team.Red, `🟥 Red card — ${red.name}`)}>Red</button>
          <button className={btnCls} onClick={() => spawn('penalty', Team.Blue, `Penalty — ${blue.name}`)}>Penalty</button>
          <button className={btnCls} onClick={() => spawn('freeKick', Team.Blue, `Free kick — ${blue.name}`)}>Free kick</button>
        </div>
      </FloatingWidget>
    </div>
  );
}
