-- CreateEnum
CREATE TYPE "Presence" AS ENUM ('Online', 'InMatch', 'Offline');

-- CreateEnum
CREATE TYPE "RankTier" AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master');

-- CreateEnum
CREATE TYPE "PlayerPosition" AS ENUM ('GK', 'RB', 'RWB', 'CB', 'LB', 'LWB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST');

-- CreateEnum
CREATE TYPE "CardRarity" AS ENUM ('Common', 'Rare', 'Epic', 'Legendary', 'Icon');

-- CreateEnum
CREATE TYPE "AcquisitionSource" AS ENUM ('WelcomePack', 'Pack', 'Market', 'Reward', 'Admin');

-- CreateEnum
CREATE TYPE "PackType" AS ENUM ('Welcome', 'Standard', 'Premium', 'Special');

-- CreateEnum
CREATE TYPE "Formation" AS ENUM ('F_4_3_3', 'F_4_4_2', 'F_4_2_3_1', 'F_3_5_2', 'F_3_4_3', 'F_5_3_2', 'F_4_5_1');

-- CreateEnum
CREATE TYPE "DuelMode" AS ENUM ('Ranked', 'Friendly');

-- CreateEnum
CREATE TYPE "DuelStatus" AS ENUM ('Pending', 'Setup', 'Live', 'Finished', 'Cancelled');

-- CreateEnum
CREATE TYPE "DuelResult" AS ENUM ('Win', 'Loss', 'Draw');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('Pending', 'Accepted', 'Declined', 'Blocked');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('Active', 'Sold', 'Cancelled');

-- CreateEnum
CREATE TYPE "WalletTxType" AS ENUM ('WelcomeGrant', 'Faucet', 'PackPurchase', 'MarketSale', 'MarketPurchase', 'BetStake', 'BetPayout', 'BetRefund', 'DuelStake', 'DuelReward', 'Adjustment');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('Bet', 'Friend', 'Match', 'Pack', 'System', 'Duel');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "division" TEXT,
ADD COLUMN     "losses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mmr" INTEGER NOT NULL DEFAULT 1200,
ADD COLUMN     "portraitSrc" TEXT,
ADD COLUMN     "presence" "Presence" NOT NULL DEFAULT 'Offline',
ADD COLUMN     "streak" TEXT,
ADD COLUMN     "tier" "RankTier" NOT NULL DEFAULT 'Bronze',
ADD COLUMN     "username" TEXT,
ADD COLUMN     "wins" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "card_catalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" "PlayerPosition" NOT NULL,
    "rating" INTEGER NOT NULL,
    "rarity" "CardRarity" NOT NULL DEFAULT 'Common',
    "stats" JSONB NOT NULL,
    "country" TEXT,
    "code" TEXT,
    "flag" TEXT,
    "holoColors" JSONB,
    "portraitSrc" TEXT,
    "realPlayerId" INTEGER,
    "isPersona" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_attribute_snapshots" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "roundKey" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "stats" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_attribute_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owned_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "acquiredVia" "AcquisitionSource" NOT NULL DEFAULT 'Pack',
    "packOpeningId" TEXT,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owned_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_openings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PackType" NOT NULL DEFAULT 'Standard',
    "size" INTEGER NOT NULL,
    "costPaid" DECIMAL(18,2),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pack_openings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "squads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My XI',
    "formation" "Formation" NOT NULL DEFAULT 'F_4_3_3',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "squads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "squad_slots" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "ownedCardId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "position" "PlayerPosition" NOT NULL,

    CONSTRAINT "squad_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duels" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "guestId" TEXT,
    "mode" "DuelMode" NOT NULL DEFAULT 'Friendly',
    "status" "DuelStatus" NOT NULL DEFAULT 'Pending',
    "stake" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "hostScore" INTEGER NOT NULL DEFAULT 0,
    "guestScore" INTEGER NOT NULL DEFAULT 0,
    "winnerId" TEXT,
    "hostResult" "DuelResult",
    "mmrDelta" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "duels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duel_lineups" (
    "id" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lineupSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duel_lineups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_listings" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "ownedCardId" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'Active',
    "buyerId" TEXT,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" TIMESTAMP(3),

    CONSTRAINT "market_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WalletTxType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_catalog_realPlayerId_idx" ON "card_catalog"("realPlayerId");

-- CreateIndex
CREATE INDEX "card_catalog_rating_idx" ON "card_catalog"("rating");

-- CreateIndex
CREATE INDEX "card_attribute_snapshots_cardId_idx" ON "card_attribute_snapshots"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "card_attribute_snapshots_cardId_roundKey_key" ON "card_attribute_snapshots"("cardId", "roundKey");

-- CreateIndex
CREATE INDEX "owned_cards_userId_idx" ON "owned_cards"("userId");

-- CreateIndex
CREATE INDEX "owned_cards_cardId_idx" ON "owned_cards"("cardId");

-- CreateIndex
CREATE INDEX "pack_openings_userId_idx" ON "pack_openings"("userId");

-- CreateIndex
CREATE INDEX "squads_userId_idx" ON "squads"("userId");

-- CreateIndex
CREATE INDEX "squad_slots_squadId_idx" ON "squad_slots"("squadId");

-- CreateIndex
CREATE UNIQUE INDEX "squad_slots_squadId_slotIndex_key" ON "squad_slots"("squadId", "slotIndex");

-- CreateIndex
CREATE INDEX "duels_hostId_idx" ON "duels"("hostId");

-- CreateIndex
CREATE INDEX "duels_guestId_idx" ON "duels"("guestId");

-- CreateIndex
CREATE INDEX "duels_status_idx" ON "duels"("status");

-- CreateIndex
CREATE INDEX "duel_lineups_duelId_idx" ON "duel_lineups"("duelId");

-- CreateIndex
CREATE UNIQUE INDEX "duel_lineups_duelId_userId_key" ON "duel_lineups"("duelId", "userId");

-- CreateIndex
CREATE INDEX "friendships_addresseeId_idx" ON "friendships"("addresseeId");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_requesterId_addresseeId_key" ON "friendships"("requesterId", "addresseeId");

-- CreateIndex
CREATE INDEX "market_listings_status_idx" ON "market_listings"("status");

-- CreateIndex
CREATE INDEX "market_listings_sellerId_idx" ON "market_listings"("sellerId");

-- CreateIndex
CREATE INDEX "wallet_transactions_userId_idx" ON "wallet_transactions"("userId");

-- CreateIndex
CREATE INDEX "wallet_transactions_refType_refId_idx" ON "wallet_transactions"("refType", "refId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_mmr_idx" ON "users"("mmr");

-- AddForeignKey
ALTER TABLE "card_attribute_snapshots" ADD CONSTRAINT "card_attribute_snapshots_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "card_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_cards" ADD CONSTRAINT "owned_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_cards" ADD CONSTRAINT "owned_cards_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "card_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owned_cards" ADD CONSTRAINT "owned_cards_packOpeningId_fkey" FOREIGN KEY ("packOpeningId") REFERENCES "pack_openings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_openings" ADD CONSTRAINT "pack_openings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squads" ADD CONSTRAINT "squads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squad_slots" ADD CONSTRAINT "squad_slots_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "squads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squad_slots" ADD CONSTRAINT "squad_slots_ownedCardId_fkey" FOREIGN KEY ("ownedCardId") REFERENCES "owned_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duels" ADD CONSTRAINT "duels_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duels" ADD CONSTRAINT "duels_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duels" ADD CONSTRAINT "duels_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_lineups" ADD CONSTRAINT "duel_lineups_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "duels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_lineups" ADD CONSTRAINT "duel_lineups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_ownedCardId_fkey" FOREIGN KEY ("ownedCardId") REFERENCES "owned_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

