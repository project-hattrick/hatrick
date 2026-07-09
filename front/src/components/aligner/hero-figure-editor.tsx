'use client';

import { useState } from 'react';

import { HeroCardShell, HeroFigure } from '@/components/home/dashboard/match-hero-card';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_FIGURE_PLACEMENT,
  HERO_PORTRAITS,
  type HeroFigurePlacement,
  type HeroTeam,
} from '@/config/match-dashboard.config';
import { teamNameFromCode } from '@/config/teams.config';
import { fifaToIso } from '@/lib/country';
import { cn } from '@/lib/utils';

type Side = 'home' | 'away';

const TEAM_CODES = Object.keys(HERO_PORTRAITS);

/** Saved placement for a team+side — tuned entry when present, side default otherwise. */
function savedPlacement(code: string, side: Side): HeroFigurePlacement {
  return { ...(HERO_PORTRAITS[code]?.[side] ?? DEFAULT_FIGURE_PLACEMENT[side]) };
}

/** One labelled range + numeric readout bound to a placement field. */
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-foreground">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-neon"
      />
    </label>
  );
}

function TeamSelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm font-semibold text-foreground"
    >
      {TEAM_CODES.map((code) => (
        <option key={code} value={code}>
          {teamNameFromCode(code)}
        </option>
      ))}
    </select>
  );
}

/**
 * Visual editor for the match-hero pixel-art figures. Pick a team per side, drag its figure to
 * set x/y, fine-tune with the sliders, then copy the entries into HERO_PORTRAITS in
 * match-dashboard.config.ts. Edits persist per team+side while the page is open.
 */
export function HeroFigureEditor() {
  const [homeCode, setHomeCode] = useState('ARG');
  const [awayCode, setAwayCode] = useState('BRA');
  const [side, setSide] = useState<Side>('home');
  // Per team+side tweaks, keyed "CODE:side" — surviving team switches so nothing is lost.
  const [edits, setEdits] = useState<Record<string, HeroFigurePlacement>>({});
  const [copied, setCopied] = useState(false);

  const codeFor = (s: Side) => (s === 'home' ? homeCode : awayCode);
  const placementFor = (s: Side) => edits[`${codeFor(s)}:${s}`] ?? savedPlacement(codeFor(s), s);
  const patchSide = (s: Side, patch: Partial<HeroFigurePlacement>) =>
    setEdits((all) => ({ ...all, [`${codeFor(s)}:${s}`]: { ...placementFor(s), ...patch } }));

  const cur = placementFor(side);
  const patch = (k: keyof HeroFigurePlacement, v: number | boolean) => patchSide(side, { [k]: v });
  const reset = () => setEdits({});

  const figureFor = (s: Side): HeroTeam => {
    const code = codeFor(s);
    return {
      name: teamNameFromCode(code),
      short: code,
      code,
      portraitSrc: HERO_PORTRAITS[code].src,
      placement: placementFor(s),
    };
  };

  // HERO_PORTRAITS entries for every team touched in this session, ready to paste.
  const editedEntries = Object.entries(
    Object.entries(edits).reduce<Record<string, Partial<Record<Side, HeroFigurePlacement>>>>(
      (acc, [key, placement]) => {
        const [code, s] = key.split(':') as [string, Side];
        acc[code] = { ...acc[code], [s]: placement };
        return acc;
      },
      {},
    ),
  );
  const output = editedEntries.length
    ? `// paste into HERO_PORTRAITS in src/config/match-dashboard.config.ts\n` +
      editedEntries
        .map(([code, sides]) => {
          const parts = [`src: '${HERO_PORTRAITS[code].src}'`];
          if (sides.home) parts.push(`home: ${JSON.stringify(sides.home)}`);
          if (sides.away) parts.push(`away: ${JSON.stringify(sides.away)}`);
          return `${code}: { ${parts.join(', ')} },`;
        })
        .join('\n')
    : '// tweak a figure to generate config';

  const copy = () => {
    void navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const home = { name: teamNameFromCode(homeCode), code: fifaToIso(homeCode) };
  const away = { name: teamNameFromCode(awayCode), code: fifaToIso(awayCode) };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-title">Hero figure editor</h1>
        <p className="text-sm text-muted-foreground">
          Pick a team per side, drag its player to reposition, fine-tune with the sliders, then copy
          the entries into{' '}
          <code className="rounded bg-surface-2 px-1 text-neon">match-dashboard.config.ts</code>.
        </p>
      </header>

      {/* Team pickers. */}
      <div className="mx-auto flex items-center gap-3">
        <TeamSelect value={homeCode} onChange={setHomeCode} />
        <span className="text-sm text-muted-foreground">vs</span>
        <TeamSelect value={awayCode} onChange={setAwayCode} />
      </div>

      {/* Live stage — the real card frame + draggable figures. */}
      <div className="mx-auto w-full max-w-[560px]">
        <HeroCardShell home={home} away={away}>
          <HeroFigure
            team={figureFor('home')}
            side="home"
            placement={placementFor('home')}
            editable
            selected={side === 'home'}
            onSelect={() => setSide('home')}
            onMove={(x, y) => patchSide('home', { x, y })}
          />
          <HeroFigure
            team={figureFor('away')}
            side="away"
            placement={placementFor('away')}
            editable
            selected={side === 'away'}
            onSelect={() => setSide('away')}
            onMove={(x, y) => patchSide('away', { x, y })}
          />
        </HeroCardShell>
      </div>

      {/* Which figure the sliders control. */}
      <div className="mx-auto inline-flex gap-1 rounded-full border border-border bg-surface-2 p-1">
        {(['home', 'away'] as Side[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition',
              side === s ? 'bg-neon text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {s} · {teamNameFromCode(codeFor(s))}
          </button>
        ))}
      </div>

      {/* Sliders for the selected figure. */}
      <div className="grid gap-x-6 gap-y-4 rounded-2xl border border-border bg-surface-2/60 p-5 sm:grid-cols-2">
        <Slider label="Width" value={cur.width} min={60} max={320} onChange={(v) => patch('width', v)} />
        <Slider label="Scale" value={cur.scale} min={0.5} max={2} step={0.01} onChange={(v) => patch('scale', v)} />
        <Slider label="X offset" value={cur.x} min={-200} max={200} onChange={(v) => patch('x', v)} />
        <Slider label="Y offset" value={cur.y} min={-100} max={100} onChange={(v) => patch('y', v)} />
        <Slider label="Crop Y (%)" value={cur.objectY} min={0} max={100} onChange={(v) => patch('objectY', v)} />
        <label className="flex items-center justify-between gap-3 self-end text-sm">
          <span className="text-muted-foreground">Flip horizontally</span>
          <button
            type="button"
            role="switch"
            aria-checked={cur.flip}
            onClick={() => patch('flip', !cur.flip)}
            className={cn('relative h-6 w-11 rounded-full transition', cur.flip ? 'bg-neon' : 'bg-surface-3')}
          >
            <span
              className={cn(
                'absolute top-0.5 size-5 rounded-full bg-background transition-all',
                cur.flip ? 'left-[22px]' : 'left-0.5',
              )}
            />
          </button>
        </label>
      </div>

      {/* Output. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-eyebrow text-muted-foreground">Config</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" shape="pill" onClick={reset}>
              Reset
            </Button>
            <Button size="sm" shape="pill" onClick={copy}>
              {copied ? 'Copied!' : 'Copy config'}
            </Button>
          </div>
        </div>
        <pre className="custom-scrollbar overflow-x-auto rounded-xl border border-border bg-surface-deep p-4 font-mono text-xs text-foreground/90">
          {output}
        </pre>
      </div>
    </div>
  );
}
