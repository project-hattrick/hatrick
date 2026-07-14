import { Injectable } from '@nestjs/common';
import { SeedCommitContext, type SeedCommit, type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * Sole owner of `seed_commits` access.
 * Stores the raw 32-byte server seed (hex) keyed by recordId so reveal can
 * recover it. The seed is NEVER returned to callers outside this module —
 * only the hash is sent on-chain at commit time.
 */
@Injectable()
export class SeedCommitRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    recordId: string;
    serverSeed: string;
    context: SeedCommitContext;
    txSig?: string;
  }): Promise<SeedCommit> {
    return this.prisma.seedCommit.create({ data });
  }

  findById(recordId: string): Promise<SeedCommit | null> {
    return this.prisma.seedCommit.findUnique({ where: { recordId } });
  }

  markRevealed(recordId: string, txSig: string): Promise<SeedCommit> {
    return this.prisma.seedCommit.update({
      where: { recordId },
      data: { revealed: true, txSig },
    });
  }

  /** Idempotent: sets txSig on first commit confirmation (best-effort). */
  updateTxSig(recordId: string, txSig: string): Promise<SeedCommit> {
    return this.prisma.seedCommit.update({
      where: { recordId },
      data: { txSig },
    });
  }
}
