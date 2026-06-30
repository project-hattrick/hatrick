import { cn } from '@/lib/utils';

interface SparklineProps {
  values: number[];
  className?: string;
}

const WIDTH = 100;
const HEIGHT = 32;

/** Token-driven SVG sparkline; stroke + area inherit `currentColor` (set text-neon on a parent). */
function Sparkline({ values, className }: SparklineProps) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? WIDTH / (values.length - 1) : WIDTH;

  const points = values.map((value, index) => {
    const x = index * step;
    const y = HEIGHT - ((value - min) / span) * (HEIGHT - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const area = `0,${HEIGHT} ${points.join(' ')} ${WIDTH},${HEIGHT}`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn('h-8 w-full text-neon', className)}
      aria-hidden
    >
      <polygon points={area} fill="currentColor" opacity={0.12} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export { Sparkline };
