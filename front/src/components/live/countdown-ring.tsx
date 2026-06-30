import { cn } from '@/lib/utils';
import { lookup } from '@/lib/lookup';
import { toneConfig, toneFallback } from '@/config/tone.config';
import { Tone } from '@/enums/tone.enum';

interface CountdownRingProps {
  seconds: number;
  max: number;
  label: string;
  tone?: Tone;
  className?: string;
}

// Unitless SVG geometry — scales with the token-sized container, not fixed px.
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular timer that EMPTIES as time runs down. Driven by `seconds` from the parent. */
function CountdownRing({ seconds, max, label, tone = Tone.Primary, className }: CountdownRingProps) {
  const fraction = max > 0 ? Math.min(1, Math.max(0, seconds / max)) : 0;
  const offset = CIRCUMFERENCE * (1 - fraction);
  const accent = lookup(toneConfig, tone, toneFallback);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={seconds}
      aria-valuetext={`${seconds}s`}
      className={cn('relative grid size-16 shrink-0 place-items-center', accent.text, className)}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeWidth={7} />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-all duration-[var(--duration-base)] ease-soft"
        />
      </svg>
      <span className="absolute text-base font-bold tabular-nums text-foreground">{seconds}</span>
    </div>
  );
}

export { CountdownRing };
