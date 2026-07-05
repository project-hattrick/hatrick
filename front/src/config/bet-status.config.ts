import { BetStatus } from '@/enums/bet-status.enum';

interface BetStatusMeta {
  label: string;
  /** Pill classes in DS tokens. */
  className: string;
}

/** Display config per bet outcome — typed lookup, no switch. */
export const betStatusConfig: Record<BetStatus, BetStatusMeta> = {
  [BetStatus.Open]: { label: 'Open', className: 'bg-warning/15 text-warning' },
  [BetStatus.Won]: { label: 'Won', className: 'bg-neon/15 text-neon' },
  [BetStatus.Lost]: { label: 'Lost', className: 'bg-live/15 text-live' },
  [BetStatus.Void]: { label: 'Void', className: 'bg-muted text-muted-foreground' },
};

export const betStatusFallback: BetStatusMeta = { label: 'Bet', className: 'bg-muted text-muted-foreground' };
