import { Presence } from '@/enums/presence.enum';

export interface PresenceMeta {
  label: string;
  /** Tailwind bg-* for the status dot. */
  dot: string;
  /** Tailwind text-* for the label. */
  text: string;
}

/** Presence styling — read via lookup, never branched with switch/case. */
export const presenceConfig: Record<Presence, PresenceMeta> = {
  [Presence.Online]: { label: 'Online', dot: 'bg-neon', text: 'text-neon' },
  [Presence.InMatch]: { label: 'In a match', dot: 'bg-warning', text: 'text-warning' },
  [Presence.Offline]: { label: 'Offline', dot: 'bg-muted-foreground/50', text: 'text-muted-foreground' },
};
