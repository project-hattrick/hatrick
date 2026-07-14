'use client';

import { useEffect, useState } from 'react';

import { useMatchKeyEvents, useMatchStore } from '@/store/match.store';
import { useRealGkStore } from '@/store/real-gk.store';
import { MatchAction } from '@/enums/match-action.enum';
import { cn } from '@/lib/utils';

/** Feed action → log label. Actions not listed (Possession / Unknown / throw-ins) are ignored. */
const ACTION_LABEL: Partial<Record<MatchAction, string>> = {
  [MatchAction.Goal]: '⚽ Goal',
  [MatchAction.YellowCard]: '🟨 Yellow card',
  [MatchAction.RedCard]: '🟥 Red card',
  [MatchAction.Penalty]: 'Penalty',
  [MatchAction.Corner]: 'Corner',
  [MatchAction.FreeKick]: 'Free kick',
  [MatchAction.Shot]: 'Shot',
  [MatchAction.Var]: 'VAR',
  [MatchAction.Substitution]: 'Sub',
};

interface Row {
  id: string;
  when: string;
  text: string;
}

/**
 * Running event log for the /engine. In REAL-match mode it reads the authoritative feed key events from
 * the match store (so it shows exactly what the API sent — no engine artifacts like a stray throw-in). In
 * mock mode it accumulates the engine's HUD beats (goals/cards/restarts the autonomous match + buttons
 * produce). Hidden until the first event lands.
 */
export function EngineEventLog({ isReplay, className }: { isReplay: boolean; className?: string }) {
  const keyEvents = useMatchKeyEvents();
  const homeName = useMatchStore((s) => s.match?.home.name ?? 'Home');
  const awayName = useMatchStore((s) => s.match?.away.name ?? 'Away');
  const [hudLog, setHudLog] = useState<Row[]>([]);

  // Mock only: diff the HUD store in the subscribe callback (keeps setState out of the effect body).
  useEffect(() => {
    if (isReplay) return;
    let n = 0;
    const team = (side: string, b: string, r: string) => (side === 'blue' ? b : side === 'red' ? r : '');
    return useRealGkStore.subscribe((s, prev) => {
      const add: string[] = [];
      if (s.scoreBlue > prev.scoreBlue) add.push(`⚽ Goal — ${s.teamBlueName}`);
      if (s.scoreRed > prev.scoreRed) add.push(`⚽ Goal — ${s.teamRedName}`);
      if (s.cardFlashSeq > prev.cardFlashSeq) {
        const t = team(s.cardFlashTeam, s.teamBlueName, s.teamRedName);
        add.push(`${s.cardFlashColor === 'red' ? '🟥' : '🟨'} Card${t ? ` — ${t}` : ''}`);
      }
      if (s.restartActive && s.restartLabel && s.restartLabel !== prev.restartLabel) {
        const t = team(s.restartTeam, s.teamBlueName, s.teamRedName);
        add.push(`${s.restartLabel}${t ? ` — ${t}` : ''}`);
      }
      if (add.length) setHudLog((cur) => [...cur, ...add.map((text) => ({ id: `h${n++}`, when: s.clock, text }))].slice(-8));
    });
  }, [isReplay]);

  const rows: Row[] = isReplay
    ? keyEvents
        .filter((e) => ACTION_LABEL[e.action])
        .slice(-8)
        .map((e, i) => ({
          id: `f${e.seq ?? i}`,
          when: e.minute != null ? `${e.minute}'` : '',
          text: `${ACTION_LABEL[e.action]}${e.participant ? ` — ${e.participant === 1 ? homeName : awayName}` : ''}`,
        }))
    : hudLog;

  if (!rows.length) return null;
  return (
    <div className={cn('pointer-events-none flex w-[220px] flex-col gap-1 rounded-lg border border-white/10 bg-black/50 p-2 shadow-xl backdrop-blur-md', className)}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Events{isReplay ? ' · live feed' : ''}</div>
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-2 text-xs text-white/85">
          <span className="w-9 shrink-0 font-mono text-[10px] tabular-nums text-white/45">{r.when}</span>
          <span className="truncate">{r.text}</span>
        </div>
      ))}
    </div>
  );
}
