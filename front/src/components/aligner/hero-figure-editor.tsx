'use client';

import { useState } from 'react';

import { HeroCardShell, HeroFigure } from '@/components/home/dashboard/match-hero-card';
import { Button } from '@/components/ui/button';
import { heroMatch, type HeroFigurePlacement } from '@/config/match-dashboard.config';
import { cn } from '@/lib/utils';

type Side = 'home' | 'away';

const clone = (p: HeroFigurePlacement): HeroFigurePlacement => ({ ...p });

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

/**
 * Visual editor for the match-hero pixel-art figures. Drag either figure to set its x/y,
 * fine-tune with the sliders, then copy the placement config back into match-dashboard.config.ts.
 */
export function HeroFigureEditor() {
  const [home, setHome] = useState<HeroFigurePlacement>(clone(heroMatch.home.placement));
  const [away, setAway] = useState<HeroFigurePlacement>(clone(heroMatch.away.placement));
  const [side, setSide] = useState<Side>('home');
  const [copied, setCopied] = useState(false);

  const cur = side === 'home' ? home : away;
  const setCur = side === 'home' ? setHome : setAway;
  const patch = (k: keyof HeroFigurePlacement, v: number | boolean) => setCur((p) => ({ ...p, [k]: v }));

  const reset = () => {
    setHome(clone(heroMatch.home.placement));
    setAway(clone(heroMatch.away.placement));
  };

  const output =
    `// paste into heroMatch in src/config/match-dashboard.config.ts\n` +
    `home: { …, placement: ${JSON.stringify(home)} },\n` +
    `away: { …, placement: ${JSON.stringify(away)} },`;

  const copy = () => {
    void navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-title">Hero figure editor</h1>
        <p className="text-sm text-muted-foreground">
          Drag either player to reposition it, fine-tune with the sliders, then copy the config into{' '}
          <code className="rounded bg-surface-2 px-1 text-neon">match-dashboard.config.ts</code>.
        </p>
      </header>

      {/* Live stage — the real card frame + draggable figures. */}
      <div className="mx-auto w-full max-w-[560px]">
        <HeroCardShell>
          <HeroFigure
            team={heroMatch.home}
            side="home"
            placement={home}
            editable
            selected={side === 'home'}
            onSelect={() => setSide('home')}
            onMove={(x, y) => setHome((p) => ({ ...p, x, y }))}
          />
          <HeroFigure
            team={heroMatch.away}
            side="away"
            placement={away}
            editable
            selected={side === 'away'}
            onSelect={() => setSide('away')}
            onMove={(x, y) => setAway((p) => ({ ...p, x, y }))}
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
            {s} · {s === 'home' ? heroMatch.home.name : heroMatch.away.name}
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
