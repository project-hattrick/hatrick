import type { ProjectFn } from '../core/types';

/** The four pitch corners as fractions of the canvas (top-left, top-right, bottom-right, bottom-left). */
export interface Corners {
  TL: [number, number];
  TR: [number, number];
  BR: [number, number];
  BL: [number, number];
}

interface Size {
  width: number;
  height: number;
}

/**
 * Builds a perspective projection from logical pitch space (field units) to canvas pixels via a
 * homography fitted to the four corners. Returns a `project(wx, wy)` that also yields a depth scale.
 */
export function buildHomography(corners: Corners, canvas: Size, field: Size): ProjectFn {
  const cw = canvas.width;
  const ch = canvas.height;
  const fw = field.width;
  const fh = field.height;

  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = [corners.TL, corners.TR, corners.BR, corners.BL].map(
    ([x, y]) => [x * cw, y * ch] as [number, number],
  );

  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  const Hm = {
    a: x1 - x0 + g * x1,
    b: x3 - x0 + h * x3,
    c: x0,
    d: y1 - y0 + g * y1,
    e: y3 - y0 + h * y3,
    f: y0,
    g,
    h,
  };

  const projXY = (u: number, v: number): [number, number] => {
    const w = Hm.g * u + Hm.h * v + 1;
    return [(Hm.a * u + Hm.b * v + Hm.c) / w, (Hm.d * u + Hm.e * v + Hm.f) / w];
  };

  const near = Math.abs(projXY(0.5, 0.999)[1] - projXY(0.5, 1.001)[1]);

  return (wx, wy) => {
    const u = wx / fw;
    const v = Math.max(-0.05, Math.min(1.22, wy / fh));
    const [x, y] = projXY(u, v);
    const dy = Math.abs(projXY(u, Math.min(1, v + 0.002))[1] - projXY(u, Math.max(0, v - 0.002))[1]);
    return { x, y, scale: dy / near };
  };
}
