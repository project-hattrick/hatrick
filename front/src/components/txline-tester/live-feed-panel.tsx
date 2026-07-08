'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Broadcast, CircleNotch, Flag, Lightning, Pulse, SoccerBall, TrendUp, Trophy, Warning } from '@/components/common/icons';
import { EmissionState } from '@/enums/emission-state.enum';
import type { MatchEventPayload } from '@/types/match';
import type { MatchFeed } from '@/services/realtime/use-match-feed';

function actionIcon(raw?: string) {
  const a = raw ?? '';
  if (a === 'goal') return SoccerBall;
  if (a === 'shot') return Lightning;
  if (a === 'corner') return Flag;
  if (a.includes('card')) return Warning;
  return Pulse;
}

function EventRow({ e }: { e: MatchEventPayload }) {
  const after = e.state === EmissionState.After;
  const Icon = actionIcon(e.rawAction);
  const label = e.rawAction ?? e.action;
  const danger = e.possessionType && e.possessionType !== 'Safe' ? e.possessionType : null;
  return (
    <div className="flex items-center gap-3 border-b border-border/50 px-3 py-1.5 text-sm">
      <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
        {typeof e.minute === 'number' ? `${e.minute}'` : '—'}
      </span>
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">
        {label}
        {e.participant ? <span className="ml-1 text-muted-foreground">· P{e.participant}</span> : null}
        {danger ? <span className="ml-1 text-amber-400">· {danger}</span> : null}
      </span>
      {e.score && (e.score.home != null || e.score.away != null) ? (
        <span className="font-mono text-xs text-muted-foreground">
          {e.score.home ?? 0}-{e.score.away ?? 0}
        </span>
      ) : null}
      <Badge
        variant="outline"
        className={
          after
            ? 'border-emerald-500/40 text-emerald-400'
            : 'border-amber-500/40 text-amber-400'
        }
      >
        {after ? 'AFTER' : 'DURING'}
      </Badge>
    </div>
  );
}

interface Props {
  label: string | null;
  home?: string;
  away?: string;
  mode?: 'replay' | 'watch';
  feed: MatchFeed;
}

export function LiveFeedPanel({ label, home, away, mode = 'replay', feed }: Props) {
  const { connected, events, score, minute, oddsCount, lastOdds, matchEnd } = feed;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Broadcast className="size-5 text-primary" />
          Live feed
        </CardTitle>
        <Badge variant="outline" className={connected ? 'border-emerald-500/40 text-emerald-400' : 'border-red-500/40 text-red-400'}>
          {connected ? 'WS connected' : 'WS offline'}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {!label ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Pick a match to start.
          </div>
        ) : (
          <>
            {/* Scoreboard */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-center gap-4">
                <span className="flex-1 text-right text-sm font-medium">{home ?? 'Home'}</span>
                <span className="rounded-md bg-background px-3 py-1 font-mono text-2xl font-bold tabular-nums">
                  {score.home}<span className="mx-1 text-muted-foreground">-</span>{score.away}
                </span>
                <span className="flex-1 text-left text-sm font-medium">{away ?? 'Away'}</span>
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <span>{minute != null ? `${minute}'` : 'pre-match'}</span>
                <span className="flex items-center gap-1"><TrendUp className="size-3.5" /> {oddsCount} odds</span>
                <span>{events.length} events</span>
              </div>
            </div>

            {matchEnd ? (
              <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                <Trophy className="size-4" /> Full time — {matchEnd.homeScore ?? score.home}-{matchEnd.awayScore ?? score.away}
                {matchEnd.outcome ? <span className="text-emerald-400/80">({matchEnd.outcome})</span> : null}
              </div>
            ) : null}

            {lastOdds ? (
              <div className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{lastOdds.superOddsType}</span>{' '}
                {lastOdds.priceNames.map((n, i) => (
                  <span key={n} className="ml-2">
                    {n} <span className="font-mono text-foreground">{((lastOdds.prices[i] ?? 0) / 1000).toFixed(2)}</span>
                  </span>
                ))}
                {lastOdds.inRunning ? <span className="ml-2 text-emerald-400">live</span> : <span className="ml-2">pre</span>}
              </div>
            ) : null}

            {/* Event log */}
            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-card">
              {events.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
                  <CircleNotch className="size-5 animate-spin" />
                  {mode === 'replay' ? 'Buffering historical replay…' : 'Waiting for the live feed…'}
                  <span className="text-xs">
                    {mode === 'replay'
                      ? 'the backend loads the full match first (~20–30s)'
                      : 'events will appear here once the match kicks off'}
                  </span>
                </div>
              ) : (
                events.map((e) => <EventRow key={`${e.seq}-${e.state}-${e.ts}`} e={e} />)
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
