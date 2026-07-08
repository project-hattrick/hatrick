import { GlassPanel } from '@/components/common/glass-panel';
import { Info } from '@/components/common/icons';
import { squadAverage, type RadarAxis } from '@/config/formation.config';

// Pentagon geometry in the SVG's own coordinate space.
const CX = 120;
const CY = 84;
const DATA_R = 52;
const RING_R = 56;
const LABEL_R = 74;
const RINGS = [0.4, 0.7, 1];

/** Polar → cartesian; axis 0 points straight up, then clockwise (SVG y grows downward). */
function polar(radius: number, index: number, count: number) {
  const angle = (-90 + (360 / count) * index) * (Math.PI / 180);
  return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
}

function polygon(radius: number, count: number, valueOf?: (i: number) => number) {
  return Array.from({ length: count }, (_, i) => {
    const r = valueOf ? radius * valueOf(i) : radius;
    const p = polar(r, i, count);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
}

function RadarLabel({ axis, index, count }: { axis: RadarAxis; index: number; count: number }) {
  const p = polar(LABEL_R, index, count);
  const anchor = Math.abs(p.x - CX) < 4 ? 'middle' : p.x > CX ? 'start' : 'end';
  return (
    <text x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle">
      <tspan className="fill-muted-foreground text-micro font-medium tracking-wide">{axis.label}</tspan>
      <tspan x={p.x} dy="10" className="fill-foreground text-micro font-bold tabular-nums">
        {axis.value}
      </tspan>
    </text>
  );
}

/** Pentagon radar of the five squad axes, drawn from config. */
function Radar() {
  const axes = squadAverage.radar;
  const n = axes.length;
  const dataPoints = polygon(DATA_R, n, (i) => axes[i].value / squadAverage.max);

  return (
    <svg viewBox="0 0 240 176" className="h-full w-full" role="img" aria-label="Squad average radar">
      {/* concentric guide rings */}
      {RINGS.map((scale) => (
        <polygon
          key={scale}
          points={polygon(RING_R * scale, n)}
          className="fill-none stroke-white/10"
          strokeWidth={1}
        />
      ))}
      {/* spokes */}
      {axes.map((axis, i) => {
        const p = polar(RING_R, i, n);
        return <line key={axis.label} x1={CX} y1={CY} x2={p.x} y2={p.y} className="stroke-white/10" strokeWidth={1} />;
      })}
      {/* data shape */}
      <polygon points={dataPoints} className="fill-neon/25 stroke-neon" strokeWidth={1.5} strokeLinejoin="round" />
      {axes.map((axis, i) => {
        const p = polar(DATA_R * (axis.value / squadAverage.max), i, n);
        return <circle key={axis.label} cx={p.x} cy={p.y} r={2.4} className="fill-neon" />;
      })}
      {axes.map((axis, i) => (
        <RadarLabel key={axis.label} axis={axis} index={i} count={n} />
      ))}
    </svg>
  );
}

/** "Squad average" — headline rating alongside the five-axis radar. */
export function SquadAverageCard() {
  return (
    <GlassPanel tone="dark" radius="xl" className="flex flex-col gap-3 p-5">
      <div className="text-eyebrow flex items-center gap-1.5 text-muted-foreground">
        Squad average
        <Info className="size-3.5" />
      </div>

      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-5xl leading-none font-bold text-neon tabular-nums">
            {squadAverage.overall}
          </span>
          <span className="text-xs text-muted-foreground">/{squadAverage.max}</span>
        </div>
        <div className="h-[112px]">
          <Radar />
        </div>
      </div>
    </GlassPanel>
  );
}
