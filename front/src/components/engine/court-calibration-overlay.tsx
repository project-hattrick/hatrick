'use client';

import { useRef, useState } from 'react';

import { pointFor, ratioFor, type CalibratorState } from '@/components/aligner/field-calibrator-data';

/** The pinned court rect on the canvas (CSS px), from `handle.calibrationFit()`. */
export interface Fit {
  x: number;
  y: number;
  w: number;
  h: number;
}

type CornerKey = keyof CalibratorState['corners'];
type LineKey = 'latLeft' | 'latRight' | 'depthTop' | 'depthBottom';
type Drag = { kind: 'corner'; key: CornerKey } | { kind: 'center' } | { kind: 'line'; key: LineKey };

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/**
 * Draggable court editor drawn over the pinned (static) full-court view. Trapezoid corners set the pitch
 * shape, the dashed quad + its 4 edge handles set the out-of-play limits, and the white dot is the kickoff
 * center. Every drag calls `onChange` with the next state; the surface pushes it to `handle.setField` so
 * the pitch remaps live. Goals stay at the court's seed values (export still includes them).
 */
export function CourtCalibrationOverlay({
  fit,
  state,
  onChange,
}: {
  fit: Fit;
  state: CalibratorState;
  onChange: (next: CalibratorState) => void;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const px = (r: { x: number; y: number }) => ({ left: fit.x + r.x * fit.w, top: fit.y + r.y * fit.h });
  const pointerRatio = (e: React.PointerEvent) => {
    const rect = layerRef.current?.getBoundingClientRect();
    const ox = rect?.left ?? 0;
    const oy = rect?.top ?? 0;
    return { x: clamp01((e.clientX - ox - fit.x) / fit.w), y: clamp01((e.clientY - oy - fit.y) / fit.h) };
  };

  const start = (e: React.PointerEvent, d: Drag) => {
    layerRef.current?.setPointerCapture(e.pointerId);
    setDrag(d);
  };
  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const r = pointerRatio(e);
    if (drag.kind === 'corner') {
      onChange({ ...state, corners: { ...state.corners, [drag.key]: { x: r.x, y: r.y } } });
    } else if (drag.kind === 'center') {
      const ld = ratioFor(state.corners, r);
      onChange({ ...state, center: { lat: clamp01(ld.lat), depth: clamp01(ld.depth) } });
    } else {
      const ld = ratioFor(state.corners, r);
      const value = drag.key === 'latLeft' || drag.key === 'latRight' ? clamp01(ld.lat) : clamp01(ld.depth);
      onChange({ ...state, playLines: { ...state.playLines, [drag.key]: value } });
    }
  };

  const c = state.corners;
  const pl = state.playLines;
  const midLat = (pl.latLeft + pl.latRight) / 2;
  const midDepth = (pl.depthTop + pl.depthBottom) / 2;
  const toSvg = (r: { x: number; y: number }) => `${fit.x + r.x * fit.w},${fit.y + r.y * fit.h}`;

  const trapezoid = [c.tl, c.tr, c.br, c.bl].map(toSvg).join(' ');
  const playQuad = [
    pointFor(c, pl.latLeft, pl.depthTop),
    pointFor(c, pl.latRight, pl.depthTop),
    pointFor(c, pl.latRight, pl.depthBottom),
    pointFor(c, pl.latLeft, pl.depthBottom),
  ]
    .map(toSvg)
    .join(' ');

  const lineHandles: { key: LineKey; pt: { x: number; y: number } }[] = [
    { key: 'latLeft', pt: pointFor(c, pl.latLeft, midDepth) },
    { key: 'latRight', pt: pointFor(c, pl.latRight, midDepth) },
    { key: 'depthTop', pt: pointFor(c, midLat, pl.depthTop) },
    { key: 'depthBottom', pt: pointFor(c, midLat, pl.depthBottom) },
  ];
  const centerPt = pointFor(c, state.center.lat, state.center.depth);

  return (
    <div
      ref={layerRef}
      className="pointer-events-auto absolute inset-0 z-10 touch-none"
      onPointerMove={move}
      onPointerUp={(e) => {
        setDrag(null);
        layerRef.current?.releasePointerCapture(e.pointerId);
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <polygon points={trapezoid} fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth={1.5} />
        <polygon points={playQuad} fill="none" stroke="#fde047" strokeWidth={1} strokeDasharray="6 5" />
      </svg>
      {(Object.keys(c) as CornerKey[]).map((k) => (
        <Handle key={k} at={px(c[k])} color="#38bdf8" label={k} onDown={(e) => start(e, { kind: 'corner', key: k })} />
      ))}
      {lineHandles.map((h) => (
        <Handle key={h.key} at={px(h.pt)} color="#fde047" onDown={(e) => start(e, { kind: 'line', key: h.key })} />
      ))}
      <Handle at={px(centerPt)} color="#ffffff" label="center" onDown={(e) => start(e, { kind: 'center' })} />
    </div>
  );
}

function Handle({
  at,
  color,
  label,
  onDown,
}: {
  at: { left: number; top: number };
  color: string;
  label?: string;
  onDown: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      onPointerDown={onDown}
      title={label}
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full active:cursor-grabbing"
      style={{ left: at.left, top: at.top, width: 15, height: 15, background: color, boxShadow: '0 0 0 2px rgba(0,0,0,0.55)' }}
    />
  );
}
