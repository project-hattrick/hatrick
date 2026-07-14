-- CreateEnum
CREATE TYPE "SeedCommitContext" AS ENUM ('Duel', 'Pack');

-- AlterTable
ALTER TABLE "duels" ADD COLUMN     "chainInitTxSig" TEXT,
ADD COLUMN     "chainSettleTxSig" TEXT;

-- AlterTable
ALTER TABLE "owned_cards" ADD COLUMN     "assetMint" TEXT,
ADD COLUMN     "mintTxSig" TEXT;

-- CreateTable
CREATE TABLE "seed_commits" (
    "recordId" TEXT NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "context" "SeedCommitContext" NOT NULL,
    "revealed" BOOLEAN NOT NULL DEFAULT false,
    "txSig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seed_commits_pkey" PRIMARY KEY ("recordId")
);
