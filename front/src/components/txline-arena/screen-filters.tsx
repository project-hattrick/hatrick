'use client';

import { useState } from 'react';

/**
 * Post-processing "screen filters" for the canvas game surfaces — pure CSS / SVG-filter / overlay
 * compositing (no engine changes), meant to MASK the low-res sprite quality. Two layers of effect:
 *   1. Canvas `filter` chain: softening blur + color grade + real chromatic aberration (SVG channel split).
 *   2. Stacked overlay layers: bloom, aperture-grille RGB mask, scanlines, rolling scanline, vignette,
 *      CRT tube bezel, light leak, film grain, color tint.
 * Fully reversible + live-tunable. Used by the France keeper sandbox and the feel-comparison grid.
 * Techniques from CRT-shader / pixel-art post-processing references (see the chat for sources).
 */

export interface ScreenFilterState {
  enabled: boolean;
  // Canvas filter chain
  blur: number; // px — softens pixel edges
  brightness: number; // %
  contrast: number; // %
  saturate: number; // %
  hue: number; // deg
  aberration: number; // px — chromatic RGB split (SVG filter)
  // Overlay layers
  bloom: number; // soft-focus haze (backdrop blur)
  vignette: number; // dark edges
  scanlines: number; // static CRT lines
  rollLine: number; // moving scanline sweep
  aperture: number; // RGB subpixel mask (aperture grille)
  tube: number; // CRT tube bezel (rounded dark corners)
  lightLeak: number; // warm corner glow
  grain: number; // film noise
  tint: number; // -1 cool (blue) .. +1 warm (orange)
}

export const OFF_FILTERS: ScreenFilterState = {
  enabled: false,
  blur: 0, brightness: 100, contrast: 100, saturate: 100, hue: 0, aberration: 0,
  bloom: 0, vignette: 0, scanlines: 0, rollLine: 0, aperture: 0, tube: 0, lightLeak: 0, grain: 0, tint: 0,
};

export const DEFAULT_FILTERS: ScreenFilterState = {
  enabled: true,
  blur: 0.5, brightness: 102, contrast: 110, saturate: 116, hue: 0, aberration: 0,
  bloom: 0.16, vignette: 0.28, scanlines: 0, rollLine: 0, aperture: 0, tube: 0, lightLeak: 0.1, grain: 0.06, tint: 0.08,
};

/** Kauã's exported look (CRT-ish, aperture + tube + rolling scanline) — the 11v11 screen defaults to this. */
export const SIGNATURE_FILTERS: ScreenFilterState = {
  enabled: true,
  blur: 0.2, brightness: 102, contrast: 110, saturate: 116, hue: 0, aberration: 0.1,
  bloom: 0.08, vignette: 0.28, scanlines: 0.12, rollLine: 0.28, aperture: 0.62, tube: 0.58, lightLeak: 0.1, grain: 0.1, tint: 0.08,
};

export interface FilterPreset {
  id: string;
  label: string;
  state: ScreenFilterState;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'off', label: 'Off', state: OFF_FILTERS },
  { id: 'signature', label: 'Signature', state: SIGNATURE_FILTERS },
  { id: 'broadcast', label: 'Broadcast', state: DEFAULT_FILTERS },
  {
    id: 'crt',
    label: 'CRT arcade',
    state: {
      enabled: true, blur: 0.6, brightness: 104, contrast: 122, saturate: 122, hue: 0, aberration: 1.2,
      bloom: 0.18, vignette: 0.42, scanlines: 0.5, rollLine: 0.18, aperture: 0.35, tube: 0.4, lightLeak: 0.12, grain: 0.12, tint: 0.05,
    },
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    state: {
      enabled: true, blur: 0.6, brightness: 96, contrast: 116, saturate: 88, hue: -4, aberration: 0.8,
      bloom: 0.24, vignette: 0.55, scanlines: 0, rollLine: 0, aperture: 0, tube: 0, lightLeak: 0.22, grain: 0.1, tint: -0.15,
    },
  },
  {
    id: 'dreamy',
    label: 'Dreamy',
    state: {
      enabled: true, blur: 1.3, brightness: 107, contrast: 103, saturate: 132, hue: 3, aberration: 0.5,
      bloom: 0.5, vignette: 0.3, scanlines: 0, rollLine: 0, aperture: 0, tube: 0, lightLeak: 0.3, grain: 0.04, tint: 0.2,
    },
  },
  {
    id: 'everything',
    label: 'Everything',
    state: {
      enabled: true, blur: 0.8, brightness: 104, contrast: 118, saturate: 124, hue: 0, aberration: 1.4,
      bloom: 0.3, vignette: 0.42, scanlines: 0.35, rollLine: 0.22, aperture: 0.35, tube: 0.45, lightLeak: 0.2, grain: 0.12, tint: 0.1,
    },
  },
];

/** The CSS `filter` value for the game canvas element (color grade + optional SVG chromatic aberration). */
export function canvasFilterCss(f: ScreenFilterState): string {
  if (!f.enabled) return 'none';
  const parts: string[] = [];
  if (f.blur > 0) parts.push(`blur(${f.blur}px)`);
  parts.push(`brightness(${f.brightness}%)`);
  parts.push(`contrast(${f.contrast}%)`);
  parts.push(`saturate(${f.saturate}%)`);
  if (f.hue !== 0) parts.push(`hue-rotate(${f.hue}deg)`);
  if (f.aberration > 0.01) parts.push('url(#ht-chroma)');
  return parts.join(' ') || 'none';
}

const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Page-level defs shared by every filtered canvas: the SVG chromatic-aberration filter (real RGB channel
 * split, offset + reblended) and the rolling-scanline keyframes. Render ONCE per page (not per grid cell).
 */
export function ScreenFilterDefs({ filters }: { filters: ScreenFilterState }) {
  const a = filters.enabled ? filters.aberration : 0;
  const b = Math.max(0.001, a * 0.22);
  return (
    <>
      <svg aria-hidden width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="ht-chroma" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
            <feOffset dx={a} dy="0" />
            <feGaussianBlur stdDeviation={b} result="r" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
            <feOffset dx={-a} dy="0" />
            <feGaussianBlur stdDeviation={b} result="bl" />
            <feBlend in="r" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="bl" mode="screen" />
          </filter>
        </defs>
      </svg>
      <style>{'@keyframes ht-rollline{0%{transform:translateY(-30%)}100%{transform:translateY(130%)}}'}</style>
    </>
  );
}

/** The stacked overlay layers. Absolutely positioned, non-interactive; sits above the canvas, below the HUD. */
export function ScreenFilterLayers({ filters }: { filters: ScreenFilterState }) {
  if (!filters.enabled) return null;
  const f = filters;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {f.bloom > 0.01 ? (
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${(2 + f.bloom * 7).toFixed(2)}px) brightness(${1 + f.bloom * 0.5})`,
            WebkitBackdropFilter: `blur(${(2 + f.bloom * 7).toFixed(2)}px) brightness(${1 + f.bloom * 0.5})`,
            opacity: f.bloom * 0.7,
          }}
        />
      ) : null}
      {f.tint !== 0 ? (
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{ background: f.tint > 0 ? '#ff9a3c' : '#3c7cff', opacity: Math.abs(f.tint) * 0.5 }}
        />
      ) : null}
      {f.aperture > 0.01 ? (
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,0,0,0.6) 0px, rgba(255,0,0,0.6) 1px, rgba(0,255,0,0.6) 1px, rgba(0,255,0,0.6) 2px, rgba(0,0,255,0.6) 2px, rgba(0,0,255,0.6) 3px)',
            opacity: f.aperture * 0.5,
          }}
        />
      ) : null}
      {f.scanlines > 0.01 ? (
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1px, transparent 1px, transparent 3px)',
            opacity: f.scanlines,
          }}
        />
      ) : null}
      {f.rollLine > 0.01 ? (
        <div
          className="absolute inset-x-0"
          style={{
            top: 0,
            height: '18%',
            background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.16), transparent)',
            mixBlendMode: 'screen',
            opacity: f.rollLine,
            animation: 'ht-rollline 7s linear infinite',
          }}
        />
      ) : null}
      {f.lightLeak > 0.01 ? (
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background:
              'radial-gradient(60% 80% at 88% 8%, rgba(255,170,90,0.9), transparent 60%), radial-gradient(50% 60% at 6% 92%, rgba(120,170,255,0.6), transparent 60%)',
            opacity: f.lightLeak,
          }}
        />
      ) : null}
      {f.vignette > 0.01 ? (
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${(f.vignette * 0.9).toFixed(2)}) 100%)` }}
        />
      ) : null}
      {f.tube > 0.01 ? (
        <div
          className="absolute inset-0"
          style={{
            borderRadius: `${(8 + f.tube * 26).toFixed(0)}px`,
            boxShadow: `inset 0 0 ${(20 + f.tube * 120).toFixed(0)}px rgba(0,0,0,0.92), inset 0 0 8px rgba(0,0,0,0.8)`,
          }}
        />
      ) : null}
      {f.grain > 0.01 ? (
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{ backgroundImage: GRAIN_URI, backgroundRepeat: 'repeat', opacity: f.grain }}
        />
      ) : null}
    </div>
  );
}

interface SliderRow {
  key: keyof ScreenFilterState;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}

const SLIDERS: SliderRow[] = [
  { key: 'blur', label: 'Soften (blur)', min: 0, max: 3, step: 0.1, suffix: 'px' },
  { key: 'bloom', label: 'Bloom / soft-focus', min: 0, max: 1, step: 0.02 },
  { key: 'aberration', label: 'Chromatic aberration', min: 0, max: 4, step: 0.1, suffix: 'px' },
  { key: 'brightness', label: 'Brightness', min: 70, max: 140, step: 1, suffix: '%' },
  { key: 'contrast', label: 'Contrast', min: 80, max: 170, step: 1, suffix: '%' },
  { key: 'saturate', label: 'Saturation', min: 0, max: 220, step: 1, suffix: '%' },
  { key: 'hue', label: 'Hue shift', min: -30, max: 30, step: 1, suffix: '°' },
  { key: 'tint', label: 'Tint (cool↔warm)', min: -1, max: 1, step: 0.05 },
  { key: 'aperture', label: 'RGB mask (aperture)', min: 0, max: 1, step: 0.02 },
  { key: 'scanlines', label: 'Scanlines (CRT)', min: 0, max: 1, step: 0.02 },
  { key: 'rollLine', label: 'Rolling scanline', min: 0, max: 1, step: 0.02 },
  { key: 'tube', label: 'CRT tube bezel', min: 0, max: 1, step: 0.02 },
  { key: 'lightLeak', label: 'Light leak', min: 0, max: 1, step: 0.02 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 1, step: 0.02 },
  { key: 'grain', label: 'Film grain', min: 0, max: 0.5, step: 0.01 },
];

/** The live filter controller panel. */
export function ScreenFilterControls({
  filters,
  onChange,
  open,
  onToggleOpen,
}: {
  filters: ScreenFilterState;
  onChange: (patch: Partial<ScreenFilterState>) => void;
  open: boolean;
  onToggleOpen: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const exportConfig = async () => {
    const json = JSON.stringify(filters, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (e.g. no permission): fall back to a prompt so the config can still be copied.
      window.prompt('Copy this filter config:', json);
    }
  };
  return (
    <div className="w-64 rounded-lg border border-white/10 bg-black/80 backdrop-blur">
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-white/80"
      >
        <span>Screen filters</span>
        <span className="text-white/40">{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <div className="max-h-[80vh] space-y-2 overflow-y-auto px-3 pb-3" data-lenis-prevent>
          <div className="flex flex-wrap gap-1">
            {FILTER_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(p.state)}
                className="rounded border border-white/15 px-2 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10"
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportConfig}
            className="w-full rounded border border-[#5f8fff]/50 bg-[#5f8fff]/15 px-2 py-1.5 text-[11px] font-semibold text-[#c7d7ff] hover:bg-[#5f8fff]/25"
          >
            {copied ? '✓ Copied — paste it to me' : 'Copy config (export)'}
          </button>
          <label className="flex items-center justify-between text-[11px] text-white/70">
            <span>Enabled</span>
            <input type="checkbox" checked={filters.enabled} onChange={(e) => onChange({ enabled: e.target.checked })} />
          </label>
          {SLIDERS.map((s) => (
            <label key={s.key} className={`block text-[11px] ${filters.enabled ? 'text-white/70' : 'text-white/30'}`}>
              <span className="flex justify-between">
                <span>{s.label}</span>
                <span className="font-mono text-white/45">
                  {typeof filters[s.key] === 'number' ? (filters[s.key] as number) : 0}
                  {s.suffix ?? ''}
                </span>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={filters[s.key] as number}
                disabled={!filters.enabled}
                onChange={(e) => onChange({ [s.key]: Number(e.target.value) })}
                className="mt-0.5 w-full accent-[#5f8fff]"
              />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
