-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('Pending', 'Won', 'Lost', 'Void', 'CashedOut');

-- CreateEnum
CREATE TYPE "MarketType" AS ENUM ('MatchResult', 'NextGoal', 'TotalGoals', 'PlayerToScore', 'Corners', 'Cards');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fixtureId" INTEGER NOT NULL,
    "market" "MarketType" NOT NULL,
    "selection" TEXT NOT NULL,
    "stake" DECIMAL(18,2) NOT NULL,
    "oddsTaken" DECIMAL(10,3) NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'Pending',
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX "bets_userId_idx" ON "bets"("userId");

-- CreateIndex
CREATE INDEX "bets_fixtureId_idx" ON "bets"("fixtureId");

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

