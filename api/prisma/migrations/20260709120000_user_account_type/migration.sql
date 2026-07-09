-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Competitor', 'Collector');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'Competitor';
