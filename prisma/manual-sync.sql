-- Synchronisation chirurgicale base <- schéma Prisma (additif, sans perte de données)
-- Contexte : la base de prod partagée (yamo principal + dashboard) est en retard sur le schéma.
-- Manquent : table WalletTransaction + 4 colonnes User (Wallet & Parrainage).

-- 1) Enums du wallet (créés seulement si absents)
DO $$ BEGIN
  CREATE TYPE "TxType" AS ENUM ('DEPOSIT','WITHDRAWAL','BOOST_PAYMENT','REFERRAL_BONUS','REFUND','ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TxStatus" AS ENUM ('PENDING','COMPLETED','FAILED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) Colonnes manquantes sur User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "walletBalance"      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode"       TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredById"       TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralBonusGiven" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX        IF NOT EXISTS "User_referredById_idx"  ON "User"("referredById");

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey"
    FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3) Table WalletTransaction
CREATE TABLE IF NOT EXISTS "WalletTransaction" (
  "id"            TEXT        NOT NULL,
  "userId"        TEXT        NOT NULL,
  "amount"        INTEGER     NOT NULL,
  "balanceBefore" INTEGER     NOT NULL,
  "balanceAfter"  INTEGER     NOT NULL,
  "type"          "TxType"    NOT NULL,
  "status"        "TxStatus"  NOT NULL DEFAULT 'COMPLETED',
  "reference"     TEXT,
  "description"   TEXT,
  "metadata"      JSONB,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WalletTransaction_userId_createdAt_idx" ON "WalletTransaction"("userId","createdAt");
CREATE INDEX IF NOT EXISTS "WalletTransaction_type_status_idx"      ON "WalletTransaction"("type","status");

DO $$ BEGIN
  ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
