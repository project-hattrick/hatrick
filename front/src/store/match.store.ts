import { create } from 'zustand';
import { MatchAction } from '@/enums/match-action.enum';
import type { LiveMatch, MatchEventPayload, MatchScore } from '@/types/match';

interface MatchStore {
  match: LiveMatch | null;
  events: MatchEventPayload[];
  setMatch: (match: LiveMatch) => void;
  applyEvent: (event: MatchEventPayload) => void;
}

function deriveScore(events: MatchEventPayload[]): MatchScore {
  const goals = events.filter((event) => event.action === MatchAction.Goal);
  return {
    home: goals.filter((goal) => goal.participant === 1).length,
    away: goals.filter((goal) => goal.participant === 2).length,
  };
}

/** during is optimistic, after is authoritative — same seq supersedes. */
function reconcile(events: MatchEventPayload[], incoming: MatchEventPayload): MatchEventPayload[] {
  const others = events.filter((event) => event.seq !== incoming.seq);
  return [...others, incoming].sort((a, b) => a.seq - b.seq).slice(-100);
}

/** Live match state fed by the realtime socket or the mock feed. */
export const useMatchStore = create<MatchStore>((set) => ({
  match: null,
  events: [],
  setMatch: (match) => set({ match }),
  applyEvent: (event) =>
    set((state) => {
      const events = reconcile(state.events, event);
      if (!state.match) return { events };
      const minute = event.minute ?? state.match.minute;
      return { events, match: { ...state.match, score: deriveScore(events), minute } };
    }),
}));

export const useMatch = () => useMatchStore((state) => state.match);
export const useMatchEvents = () => useMatchStore((state) => state.events);
