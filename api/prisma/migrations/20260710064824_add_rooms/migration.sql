-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('Open', 'Live', 'Closed');

-- CreateEnum
CREATE TYPE "RoomMemberRole" AS ENUM ('Host', 'Member');

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Private room',
    "status" "RoomStatus" NOT NULL DEFAULT 'Open',
    "inviteToken" TEXT NOT NULL,
    "fixtureId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_members" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RoomMemberRole" NOT NULL DEFAULT 'Member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_messages" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_inviteToken_key" ON "rooms"("inviteToken");

-- CreateIndex
CREATE INDEX "rooms_hostId_idx" ON "rooms"("hostId");

-- CreateIndex
CREATE INDEX "rooms_status_idx" ON "rooms"("status");

-- CreateIndex
CREATE INDEX "room_members_roomId_idx" ON "room_members"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "room_members_roomId_userId_key" ON "room_members"("roomId", "userId");

-- CreateIndex
CREATE INDEX "room_messages_roomId_createdAt_idx" ON "room_messages"("roomId", "createdAt");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
