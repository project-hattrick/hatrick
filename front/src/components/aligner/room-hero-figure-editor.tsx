'use client';

import { useState } from 'react';

import { HeroFigure } from '@/components/home/dashboard/match-hero-card';
import { RoomHeroFrame } from '@/components/room/room-hero-frame';
import { Button } from '@/components/ui/button';
import { HERO_PORTRAITS, type HeroFigurePlacement, type HeroTeam } from '@/config/match-dashboard.config';
import { roomHeroTeamFor } from '@/config/room-hero.config';
import { teamColor } from '@/config/team-colors.config';
import { teamNameFromCode } from '@/config/teams.config';
import { fifaToIso } from '@/lib/country';
import { cn } from '@/lib/utils';

type Side = 'home' | 'away';

const TEAM_CODES = Object.keys(HERO_PORTRAITS);

/** Real bet-panel widths per room layout — tune against the narrowest so text stays clear in both. */
const PREVIEW_WIDTHS = [
  { label: 'Immersive · 330', width: 330 },
  { label: 'Split · 392', width: 392 },
] as const;

/** Current effective room placement for a team+side (override when tuned, outset fallback else). */
function savedPlacement(code: string, side: Side): HeroFigurePlacement {
  return { ...roomHeroTeamFor(teamNameFromCode(code), code, side).placement };
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
 * Visual editor for the ROOM bet-panel hero figures. Renders the exact room header frame (150px,
 * scaled-down figures) so tuning is 1:1 with what the room shows — and writes to the room-only
 * ROOM_HERO_PLACEMENTS, so it never touches the landing hero card. Pick a team per side, drag its
 * figure to set x/y, fine-tune with the sliders, then copy the entries into
 * `src/config/room-hero.config.ts`. Edits persist per team+side while the page is open.
 */
export function RoomHeroFigureEditor() {
  const [homeCode, setHomeCode] = useState('ARG');
  const [awayCode, setAwayCode] = useState('SUI');
  const [side, setSide] = useState<Side>('home');
  const [previewWidth, setPreviewWidth] = useState<number>(PREVIEW_WIDTHS[0].width);
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

  // ROOM_HERO_PLACEMENTS entries for every team touched in this session, ready to paste.
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
    ? `// paste into ROOM_HERO_PLACEMENTS in src/config/room-hero.config.ts\n` +
      editedEntries
        .map(([code, sides]) => {
          const parts: string[] = [];
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

  const homeColor = teamColor(fifaToIso(homeCode));
  const awayColor = teamColor(fifaToIso(awayCode));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-title">Room hero figure editor</h1>
        <p className="text-sm text-muted-foreground">
          Reposition the pixel-art players on the room{' '}
          <span className="text-foreground">&ldquo;starting soon&rdquo;</span> header. Writes to the
          room-only{' '}
          <code className="rounded bg-surface-2 px-1 text-neon">ROOM_HERO_PLACEMENTS</code> — the
          landing hero card is left untouched. Pick a team per side, drag its player, fine-tune, then
          copy the entries into{' '}
          <code className="rounded bg-surface-2 px-1 text-neon">room-hero.config.ts</code>.
        </p>
      </header>

      {/* Team pickers. */}
      <div className="mx-auto flex items-center gap-3">
        <TeamSelect value={homeCode} onChange={setHomeCode} />
        <span className="text-sm text-muted-foreground">vs</span>
        <TeamSelect value={awayCode} onChange={setAwayCode} />
      </div>

      {/* Which room layout width to tune against — the panel is narrower than it looks. */}
      <div className="mx-auto inline-flex gap-1 rounded-full border border-border bg-surface-2 p-1">
        {PREVIEW_WIDTHS.map((w) => (
          <button
            key={w.width}
            type="button"
            onClick={() => setPreviewWidth(w.width)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-semibold transition',
              previewWidth === w.width
                ? 'bg-neon text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Live stage — the REAL room panel width so tuning is 1:1 (figures + scale-90 identical). */}
      <div
        className="mx-auto w-full overflow-hidden rounded-2xl border border-border"
        style={{ maxWidth: previewWidth }}
      >
        <RoomHeroFrame
          homeColor={homeColor}
          awayColor={awayColor}
          figures={
            <>
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
            </>
          }
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 font-mono text-micro font-bold tracking-wider text-white/85 uppercase ring-1 ring-white/10 backdrop-blur-md">
            <span className="size-1.5 animate-pulse rounded-full bg-neon" />
            Starting soon
          </span>
          <span className="text-[15px] font-bold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            {teamNameFromCode(homeCode)} <span className="text-white/45">vs</span>{' '}
            {teamNameFromCode(awayCode)}
          </span>
          <span className="font-mono text-xl font-bold tabular-nums text-neon drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            00:38
          </span>
        </RoomHeroFrame>
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
