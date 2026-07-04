import { GlassPanel } from '@/components/common/glass-panel';
import { performance } from '@/config/match-dashboard.config';

const W = 300;
const H = 120;
const PAD = 8;

function toPoints(values: number[]) {
  const max = 100;
  const stepX = (W - PAD * 2) / (values.length - 1);
  return values.map((v, i) => ({
    x: PAD + i * stepX,
    y: PAD + (1 - v / max) * (H - PAD * 2),
  }));
}

/** Catmull-Rom → cubic Bézier for a smooth line through the points. */
function smoothLine(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function Series({ points, color, id }: { points: number[]; color: string; id: string }) {
  const pts = toPoints(points);
  const line = smoothLine(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${H - PAD} L ${pts[0].x} ${H - PAD} Z`;
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/** "Graphic Performance" — two smooth series over the match timeline. */
export function PerformanceChart() {
  return (
    <GlassPanel tone="surface" radius="xl" className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">Graphic Performance</span>
        <span className="rounded-md border border-white/10 px-2 py-0.5 text-micro font-semibold text-muted-foreground">
          Full time
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)} stroke="currentColor" strokeOpacity={0.08} className="text-white" />
        ))}
        <Series points={performance.away.points} color={performance.away.color} id="perf-away" />
        <Series points={performance.home.points} color={performance.home.color} id="perf-home" />
      </svg>

      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-[10px] font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: performance.home.color }} />{performance.home.name}</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: performance.away.color }} />{performance.away.name}</span>
        </div>
        <div className="hidden gap-3 font-mono text-[9px] text-muted-foreground/70 sm:flex">
          {performance.labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}
