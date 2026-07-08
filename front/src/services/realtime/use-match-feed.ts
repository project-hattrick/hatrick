'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getSocket } from './socket';
import { EmissionState } from '@/enums/emission-state.enum';
import type { MatchEndPayload, MatchEventPayload, OddsEventPayload } from '@/types/match';

const MAX_EVENTS = 150;
// The gateway emits these literal channels (no shared enum with the api).
const CH_ODDS = 'odds.update';
const CH_MATCH_END = 'match-end.after';

export interface MatchFeed {
  connected: boolean;
  events: MatchEventPayload[];
  score: { home: number; away: number };
  minute: number | null;
  oddsCount: number;
  lastOdds: OddsEventPayload | null;
  matchEnd: MatchEndPayload | null;
  reset: () => void;
}

/**
 * Self-contained live feed for one fixture over the realtime socket. Kept apart
 * from the global match store (which reconciles into a themed LiveMatch and
 * gates on the mock flag) so the test screen sees raw, unmediated events.
 */
export function useMatchFeed(fixtureId: number | null): MatchFeed {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<MatchEventPayload[]>([]);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [minute, setMinute] = useState<number | null>(null);
  const [oddsCount, setOddsCount] = useState(0);
  const [lastOdds, setLastOdds] = useState<OddsEventPayload | null>(null);
  const [matchEnd, setMatchEnd] = useState<MatchEndPayload | null>(null);

  // Read the current fixture inside stable listeners without re-subscribing.
  const fixtureRef = useRef<number | null>(fixtureId);
  fixtureRef.current = fixtureId;

  const reset = useCallback(() => {
    setEvents([]);
    setScore({ home: 0, away: 0 });
    setMinute(null);
    setOddsCount(0);
    setLastOdds(null);
    setMatchEnd(null);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    setConnected(socket.connected);

    const mine = (id: number) => fixtureRef.current != null && id === fixtureRef.current;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onMatch = (p: MatchEventPayload) => {
      if (!mine(p.fixtureId)) return;
      setEvents((prev) => [p, ...prev].slice(0, MAX_EVENTS));
      if (typeof p.minute === 'number') setMinute(p.minute);
      if (p.score) setScore((s) => ({ home: p.score?.home ?? s.home, away: p.score?.away ?? s.away }));
    };
    const onOdds = (p: OddsEventPayload) => {
      if (!mine(p.fixtureId)) return;
      setOddsCount((n) => n + 1);
      setLastOdds(p);
    };
    const onEnd = (p: MatchEndPayload) => {
      if (mine(p.fixtureId)) setMatchEnd(p);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(`match-event.${EmissionState.During}`, onMatch);
    socket.on(`match-event.${EmissionState.After}`, onMatch);
    socket.on(CH_ODDS, onOdds);
    socket.on(CH_MATCH_END, onEnd);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(`match-event.${EmissionState.During}`, onMatch);
      socket.off(`match-event.${EmissionState.After}`, onMatch);
      socket.off(CH_ODDS, onOdds);
      socket.off(CH_MATCH_END, onEnd);
    };
  }, []);

  return { connected, events, score, minute, oddsCount, lastOdds, matchEnd, reset };
}
