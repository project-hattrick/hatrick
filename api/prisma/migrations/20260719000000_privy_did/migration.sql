-- AlterTable
ALTER TABLE "users" ADD COLUMN "privyDid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_privyDid_key" ON "users"("privyDid");
