'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toneConfig } from '@/config/tone.config';
import { Tone } from '@/enums/tone.enum';
import { cn } from '@/lib/utils';

/* ── Token tables (rendered from CSS vars — no hardcoded hex) ─────────────────── */

const SURFACES = ['background', 'surface-1', 'surface-2', 'surface-3', 'surface-deep', 'card', 'popover', 'overlay'];
const ACCENT = ['neon', 'neon-hover', 'primary', 'ring'];
const SEMANTIC = ['positive', 'warning', 'danger', 'info', 'neutral'];
const TEAM = ['team-home', 'team-away'];
const MEDAL = ['medal-gold', 'medal-silver', 'medal-bronze'];
const CHART = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'];
// Full literal class names — Tailwind can't detect dynamically-built strings.
const RADII = [
  { c: 'rounded-sm', n: 'sm' },
  { c: 'rounded-md', n: 'md' },
  { c: 'rounded-lg', n: 'lg' },
  { c: 'rounded-xl', n: 'xl' },
  { c: 'rounded-2xl', n: '2xl' },
  { c: 'rounded-3xl', n: '3xl' },
  { c: 'rounded-4xl', n: '4xl' },
];
const ELEVATION = [
  { c: 'shadow-e1', n: 'e1' },
  { c: 'shadow-e2', n: 'e2' },
  { c: 'shadow-e3', n: 'e3' },
  { c: 'shadow-e4', n: 'e4' },
];

const TYPE = [
  { cls: 'text-display', label: '.text-display', sample: 'Live the World Cup', note: '24 → 30px · 700 · heading' },
  { cls: 'text-title', label: '.text-title', sample: 'Your fantasy squad', note: '20 → 24px · 700 · section' },
  { cls: 'text-lead', label: '.text-lead', sample: 'One platform, two ways to play.', note: '16px · lead paragraph' },
  { cls: 'text-body', label: '.text-body', sample: 'Body copy — follow real matches minute by minute.', note: '14px · default body' },
  { cls: 'text-caption', label: '.text-caption', sample: 'Meta / helper text', note: '12px · caption' },
  { cls: 'text-eyebrow', label: '.text-eyebrow', sample: 'Live right now', note: '10px · uppercase kicker' },
  { cls: 'text-micro', label: '.text-micro', sample: 'ON THE BALL · 128W', note: '10px · dense label' },
];

const BUTTONS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const;
const BADGES = ['default', 'secondary', 'outline', 'positive', 'warning', 'info', 'destructive'] as const;

/* ── Small building blocks ───────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 scroll-mt-6">
      <h2 className="text-title">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ token, onSurface }: { token: string; onSurface?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn('h-14 w-full rounded-xl border border-border', onSurface && 'bg-surface-2')}
        style={{ background: onSurface ? undefined : `var(--color-${token})` }}
      >
        {onSurface ? <div className="m-3 h-8 rounded-lg" style={{ background: `var(--color-${token})` }} /> : null}
      </div>
      <div className="flex flex-col">
        <span className="text-caption text-foreground">--color-{token}</span>
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{children}</div>;
}

/* ── The showcase ────────────────────────────────────────────────────────────── */

export function StyleGuide() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <span className="text-eyebrow text-neon">Design System</span>
        <h1 className="text-display">Hat-trick — Neon Turf</h1>
        <p className="text-lead max-w-2xl text-muted-foreground">
          The single source of truth. Every colour, size, radius and shadow is a token in{' '}
          <code className="rounded bg-surface-2 px-1 text-neon">globals.css</code>; components reference roles,
          never raw values. Build new screens from these and the system stays coherent.
        </p>
      </header>

      <Section title="Colour — surfaces">
        <Grid>{SURFACES.map((t) => <Swatch key={t} token={t} />)}</Grid>
      </Section>

      <Section title="Colour — accent & text">
        <Grid>
          {ACCENT.map((t) => <Swatch key={t} token={t} />)}
          <Swatch token="foreground" />
          <Swatch token="muted-foreground" />
          <Swatch token="border" onSurface />
          <Swatch token="input" onSurface />
        </Grid>
      </Section>

      <Section title="Colour — semantic roles">
        <p className="text-body text-muted-foreground">
          Components use these roles (positive/warning/danger/info/neutral), never hue names. Swap the accent
          and everything follows.
        </p>
        <Grid>{SEMANTIC.map((t) => <Swatch key={t} token={t} />)}</Grid>
      </Section>

      <Section title="Colour — team, medal & charts">
        <Grid>
          {TEAM.map((t) => <Swatch key={t} token={t} />)}
          {MEDAL.map((t) => <Swatch key={t} token={t} />)}
          {CHART.map((t) => <Swatch key={t} token={t} />)}
        </Grid>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface-2/60">
          {TYPE.map((t) => (
            <div key={t.cls} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:justify-between">
              <span className={cn(t.cls, 'text-foreground')}>{t.sample}</span>
              <span className="text-caption shrink-0 text-muted-foreground">
                <code className="text-neon">{t.label}</code> · {t.note}
              </span>
            </div>
          ))}
        </div>
        <p className="text-caption text-muted-foreground">
          Fonts: <span className="font-sans text-foreground">Inter (sans)</span> ·{' '}
          <span className="font-mono text-foreground">Geist Mono</span> ·{' '}
          <span className="text-foreground">Talero (display numerals)</span>.
        </p>
      </Section>

      <Section title="Radius">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {RADII.map((r) => (
            <div key={r.n} className="flex flex-col items-center gap-2">
              <div className={cn('size-16 border border-border bg-surface-3', r.c)} />
              <span className="text-caption text-muted-foreground">{r.c}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Elevation">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {ELEVATION.map((e) => (
            <div key={e.n} className={cn('grid h-24 place-items-center rounded-2xl bg-surface-2', e.c)}>
              <span className="text-caption text-muted-foreground">{e.c}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing & layout">
        <p className="text-body text-muted-foreground">
          Card padding tiers — <code className="text-neon">p-4</code> for dense/data cards,{' '}
          <code className="text-neon">p-5</code> for feature cards. Page gutter{' '}
          <code className="text-neon">px-6</code>, section gap <code className="text-neon">gap-8</code>.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <GlassPanel tone="surface" className="p-4">
            <span className="text-caption text-muted-foreground">GlassPanel · p-4 (data)</span>
          </GlassPanel>
          <GlassPanel tone="surface" className="p-5">
            <span className="text-caption text-muted-foreground">GlassPanel · p-5 (feature)</span>
          </GlassPanel>
        </div>
      </Section>

      <Section title="Surfaces — GlassPanel">
        <div className="grid gap-3 sm:grid-cols-3">
          {(['blur', 'surface', 'dark'] as const).map((tone) => (
            <GlassPanel key={tone} tone={tone} className="flex h-24 items-center justify-center">
              <span className="text-caption text-muted-foreground">tone=&quot;{tone}&quot;</span>
            </GlassPanel>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          {BUTTONS.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">sm</Button>
          <Button>default</Button>
          <Button size="lg">lg</Button>
          <Button shape="pill">pill</Button>
          <Button shape="pill" variant="outline">
            pill outline
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          {BADGES.map((v) => (
            <Badge key={v} variant={v}>
              {v}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Semantic tones (tone.config)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(Tone).map((tone) => {
            const c = toneConfig[tone];
            return (
              <div key={tone} className={cn('flex items-center gap-3 rounded-xl border p-3', c.border)}>
                <span className={cn('grid size-9 place-items-center rounded-lg text-sm font-bold', c.fill)}>
                  {tone[0]}
                </span>
                <div className="flex flex-col">
                  <span className={cn('text-sm font-semibold', c.text)}>{tone}</span>
                  <span className={cn('inline-flex items-center gap-1.5 text-caption', 'text-muted-foreground')}>
                    <span className={cn('size-1.5 rounded-full', c.dot)} /> dot · soft · border · text
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Forms">
        <div className="grid gap-3 sm:max-w-md">
          <label className="flex flex-col gap-1.5">
            <span className="text-eyebrow text-muted-foreground">Field label</span>
            <Input placeholder="Type here…" />
          </label>
          <SectionHeader title="Panel header" action={<span className="text-caption text-neon">action</span>} className="rounded-xl border border-border bg-surface-2/60" />
        </div>
      </Section>

      <Section title="Motion">
        <p className="text-body text-muted-foreground">
          Durations <code className="text-neon">--duration-fast/base/slow</code> (140/240/420ms), easing{' '}
          <code className="text-neon">--ease-soft</code>. Hover a card:
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(['fast', 'base', 'slow'] as const).map((d) => (
            <div
              key={d}
              className="grid h-20 place-items-center rounded-2xl bg-surface-2 transition-transform ease-soft hover:-translate-y-1 hover:bg-surface-3"
              style={{ transitionDuration: `var(--duration-${d})` }}
            >
              <span className="text-caption text-muted-foreground">duration-{d}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
