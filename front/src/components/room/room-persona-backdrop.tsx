'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { RealGkBackground } from '@/components/game/real-gk/real-gk-background';
import {
  SIGNATURE_FILTERS,
  ScreenFilterDefs,
  ScreenFilterLayers,
  canvasFilterCss,
} from '@/components/game/screen-filters';
import { recapMatch } from '@/config/recap-match.config';
import { buildRealGkFixtureConfig } from '@/game/realgk/fixture-config';
import type { RealGkHandle } from '@/game/realgk/types';
import { cn } from '@/lib/utils';
import { useRealgkDriver } from '@/services/realtime/use-realgk-driver';
import { useMatchStore } from '@/store/match.store';
import { useRoomRadarStore } from '@/store/room-radar.store';

/**
 * Room backdrop: the same feed-driven ambient sim as the home hero, but the engine boots with the
 * persona-cast "new model" (bodies + persona heads + full match features) and the two teams' recolored
 * body packs resolved from the ROOM's fixture — mirroring the argentina-vs-norway arena. Upcoming
 * fixtures whose teams have packs also get the "Signature" screen filter; older fixtures render the
 * default France/Netherlands bodies with no filter.
 *
 * Name/code-only selectors: the match object is replaced on EVERY stream event — subscribing to it
 * would rebuild the config (and thus reboot the engine) each minute/score tick. Keyed on the four team
 * strings, the config is stable across ticks and only rebuilds on an actual match switch.
 */
export function RoomPersonaBackdrop({
  bridgeHud = false,
  className,
  feedRadar = false,
}: {
  bridgeHud?: boolean;
  className?: string;
  /** Only the persistent ambient engine feeds the mini-pitch radar — keeps a single writer to the store. */
  feedRadar?: boolean;
}) {
  const homeName = useMatchStore((state) => (state.match ?? recapMatch).home.name);
  const homeCode = useMatchStore((state) => (state.match ?? recapMatch).home.code);
  const awayName = useMatchStore((state) => (state.match ?? recapMatch).away.name);
  const awayCode = useMatchStore((state) => (state.match ?? recapMatch).away.code);
  const handleRef = useRef<RealGkHandle | null>(null);

  const { config, styled } = useMemo(
    () => buildRealGkFixtureConfig({ name: homeName, code: homeCode }, { name: awayName, code: awayCode }),
    [homeName, homeCode, awayName, awayCode],
  );

  const onReady = useCallback((handle: RealGkHandle | null) => {
    handleRef.current = handle;
  }, []);

  // Bridge the room's chosen match into the engine (imperative; goals/shots/score mirror the feed 1:1).
  useRealgkDriver(handleRef);

  // Feed live positions into the mini-pitch radar a few times a second (the engine runs at 60fps; the
  // radar only needs enough samples to read as continuous movement). Cleared on unmount so a stale
  // snapshot never lingers behind a torn-down engine.
  useEffect(() => {
    if (!feedRadar) return;
    const setRadar = useRoomRadarStore.getState().setRadar;
    const id = window.setInterval(() => {
      const handle = handleRef.current;
      if (handle) setRadar(handle.sampleRadar());
    }, 90);
    return () => {
      window.clearInterval(id);
      setRadar(null);
    };
  }, [feedRadar]);

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <RealGkBackground
        config={config}
        bridgeHud={bridgeHud}
        onReady={onReady}
        teamNames={{ blue: homeName, red: awayName }}
        canvasFilter={styled ? canvasFilterCss(SIGNATURE_FILTERS) : undefined}
      />
      {styled ? (
        <>
          <ScreenFilterDefs filters={SIGNATURE_FILTERS} />
          <ScreenFilterLayers filters={SIGNATURE_FILTERS} />
        </>
      ) : null}
    </div>
  );
}
