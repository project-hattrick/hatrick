import { Tone } from '@/enums/tone.enum';

/** Token-only class sets per semantic role — no raw colors, DS tokens only. */
export interface ToneClasses {
  text: string;
  fill: string;
  soft: string;
  border: string;
  ring: string;
  dot: string;
}

export const toneConfig: Record<Tone, ToneClasses> = {
  [Tone.Neutral]: {
    text: 'text-muted-foreground',
    fill: 'bg-neutral text-neutral-foreground',
    soft: 'bg-surface-3 text-muted-foreground',
    border: 'border-border',
    ring: 'ring-border',
    dot: 'bg-muted-foreground',
  },
  [Tone.Primary]: {
    text: 'text-primary',
    fill: 'bg-primary text-primary-foreground',
    soft: 'bg-primary/10 text-primary',
    border: 'border-primary/40',
    ring: 'ring-primary',
    dot: 'bg-primary',
  },
  [Tone.Positive]: {
    text: 'text-positive',
    fill: 'bg-positive text-positive-foreground',
    soft: 'bg-positive/10 text-positive',
    border: 'border-positive/40',
    ring: 'ring-positive',
    dot: 'bg-positive',
  },
  [Tone.Warning]: {
    text: 'text-warning',
    fill: 'bg-warning text-warning-foreground',
    soft: 'bg-warning/10 text-warning',
    border: 'border-warning/40',
    ring: 'ring-warning',
    dot: 'bg-warning',
  },
  [Tone.Danger]: {
    text: 'text-danger',
    fill: 'bg-danger text-danger-foreground',
    soft: 'bg-danger/10 text-danger',
    border: 'border-danger/40',
    ring: 'ring-danger',
    dot: 'bg-danger',
  },
  [Tone.Info]: {
    text: 'text-info',
    fill: 'bg-info text-info-foreground',
    soft: 'bg-info/10 text-info',
    border: 'border-info/40',
    ring: 'ring-info',
    dot: 'bg-info',
  },
};

export const toneFallback: ToneClasses = toneConfig[Tone.Neutral];
