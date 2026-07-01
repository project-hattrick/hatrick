'use client';

import { ExternalLink, ShieldCheck } from 'lucide-react';

import { MarketType } from '@/enums';
import { GlassPanel } from '@/components/common/glass-panel';
import { useSettlementProof } from '@/services/queries/use-settlement-proof';

const short = (hex: string): string => (hex.length > 16 ? `${hex.slice(0, 8)}…${hex.slice(-8)}` : hex);

interface SettlementProofPanelProps {
  fixtureId: number;
  market?: MarketType;
}

/**
 * "Ver prova do resultado" — shows that a settled market's result was verified
 * on-chain (TxLINE Merkle root + result hash), with a plain-language note and a
 * Solana Explorer link. A fan with no blockchain knowledge can see the payout
 * can't have been altered.
 */
export function SettlementProofPanel({ fixtureId, market = MarketType.MatchResult }: SettlementProofPanelProps) {
  const { data, isLoading } = useSettlementProof(fixtureId, market);

  if (isLoading) return <p className="text-sm text-muted-foreground">Checking on-chain result…</p>;
  if (!data) return null;
  if (!data.settled) {
    return <p className="text-sm text-muted-foreground">Result not settled on-chain yet.</p>;
  }

  return (
    <GlassPanel tone="dark" className="p-4 space-y-3">
      <header className="flex items-center gap-2 text-emerald-400">
        <ShieldCheck className="size-5" aria-hidden />
        <span className="font-semibold tracking-tight">Result verified on-chain</span>
      </header>

      <p className="text-sm text-muted-foreground">
        This result was confirmed by a cryptographic signature and proven against the TxLINE result
        tree. The payout is settled by the contract — no one can alter it.
      </p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm font-mono">
        <dt className="text-muted-foreground">Outcome</dt>
        <dd className="text-right">{data.outcome ?? '—'}</dd>
        <dt className="text-muted-foreground">Winning / total pool</dt>
        <dd className="text-right">{data.winningPool} / {data.totalPool}</dd>
        <dt className="text-muted-foreground">Merkle root</dt>
        <dd className="text-right">{short(data.merkleRoot)}</dd>
        <dt className="text-muted-foreground">Result hash</dt>
        <dd className="text-right">{short(data.resultHash)}</dd>
      </dl>

      <a
        href={data.explorerUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        View on Solana Explorer
        <ExternalLink className="size-4" aria-hidden />
      </a>
    </GlassPanel>
  );
}
