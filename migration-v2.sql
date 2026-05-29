-- ============================================================
-- Migration v2 — Wallet, Vérification, Parrainage, Retraits
-- À exécuter dans Supabase SQL Editor APRÈS init.sql
-- ============================================================

-- ============================================================
-- ENUMS — nouveaux
-- ============================================================
CREATE TYPE "TxType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'BOOST_PAYMENT', 'REFERRAL_BONUS', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "IdDocType" AS ENUM ('CNI', 'PASSPORT', 'DRIVING_LICENSE');

-- Ajouter WALLET au enum PaymentProvider existant
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'WALLET';

-- ============================================================
-- USER — nouvelles colonnes
-- ============================================================
ALTER TABLE "User"
  ADD COLUMN "walletBalance"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "referralCode"      TEXT,
  ADD COLUMN "referredById"      TEXT,
  ADD COLUMN "referralBonusGiven" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "identityHash"      TEXT;

CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");
CREATE INDEX "User_referredById_idx" ON "User"("referredById");
CREATE INDEX "User_identityHash_idx" ON "User"("identityHash");

ALTER TABLE "User"
  ADD CONSTRAINT "User_referredById_fkey"
  FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- PAYMENT — providerRef unique
-- ============================================================
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef") WHERE "providerRef" IS NOT NULL;

-- ============================================================
-- WalletTransaction
-- ============================================================
CREATE TABLE "WalletTransaction" (
  "id"            TEXT PRIMARY KEY,
  "userId"        TEXT NOT NULL,
  "amount"        INTEGER NOT NULL,
  "balanceBefore" INTEGER NOT NULL,
  "balanceAfter"  INTEGER NOT NULL,
  "type"          "TxType" NOT NULL,
  "status"        "TxStatus" NOT NULL DEFAULT 'COMPLETED',
  "reference"     TEXT,
  "description"   TEXT,
  "metadata"      JSONB,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "WalletTransaction_userId_createdAt_idx" ON "WalletTransaction"("userId", "createdAt");
CREATE INDEX "WalletTransaction_type_status_idx" ON "WalletTransaction"("type", "status");

ALTER TABLE "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- WithdrawalRequest
-- ============================================================
CREATE TABLE "WithdrawalRequest" (
  "id"               TEXT PRIMARY KEY,
  "userId"           TEXT NOT NULL,
  "amount"           INTEGER NOT NULL,
  "provider"         "PaymentProvider" NOT NULL,
  "destinationPhone" TEXT NOT NULL,
  "status"           "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "providerRef"      TEXT,
  "approvedById"     TEXT,
  "approvedAt"       TIMESTAMP(3),
  "failureReason"    TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL
);

CREATE INDEX "WithdrawalRequest_status_createdAt_idx" ON "WithdrawalRequest"("status", "createdAt");
CREATE INDEX "WithdrawalRequest_userId_idx" ON "WithdrawalRequest"("userId");

ALTER TABLE "WithdrawalRequest"
  ADD CONSTRAINT "WithdrawalRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WithdrawalRequest"
  ADD CONSTRAINT "WithdrawalRequest_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- IdVerification
-- ============================================================
CREATE TABLE "IdVerification" (
  "id"               TEXT PRIMARY KEY,
  "userId"           TEXT NOT NULL,
  "documentType"     "IdDocType" NOT NULL,
  "documentNumber"   TEXT NOT NULL,
  "documentFrontUrl" TEXT NOT NULL,
  "documentBackUrl"  TEXT,
  "selfieUrl"        TEXT NOT NULL,
  "status"           "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "rejectionReason"  TEXT,
  "reviewedById"     TEXT,
  "reviewedAt"       TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL
);

CREATE INDEX "IdVerification_status_createdAt_idx" ON "IdVerification"("status", "createdAt");
CREATE INDEX "IdVerification_userId_idx" ON "IdVerification"("userId");

ALTER TABLE "IdVerification"
  ADD CONSTRAINT "IdVerification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IdVerification"
  ADD CONSTRAINT "IdVerification_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- BlockedIdentity
-- ============================================================
CREATE TABLE "BlockedIdentity" (
  "id"           TEXT PRIMARY KEY,
  "identityHash" TEXT NOT NULL,
  "reason"       TEXT NOT NULL,
  "bannedById"   TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "BlockedIdentity_identityHash_key" ON "BlockedIdentity"("identityHash");
CREATE INDEX "BlockedIdentity_identityHash_idx" ON "BlockedIdentity"("identityHash");

-- ============================================================
-- SiteSetting — colonnes additionnelles
-- ============================================================
ALTER TABLE "SiteSetting"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN "label"    TEXT;

CREATE INDEX "SiteSetting_category_idx" ON "SiteSetting"("category");

-- ============================================================
-- Favorite — index userId
-- ============================================================
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- ============================================================
-- Seed des réglages tarifaires & parrainage
-- ============================================================
INSERT INTO "SiteSetting" ("key", "value", "category", "label", "updatedAt") VALUES
  ('pricing.premium.amount',  '5000',  'pricing',  'Prix Premium (FCFA)',                CURRENT_TIMESTAMP),
  ('pricing.premium.days',    '30',    'pricing',  'Durée Premium (jours)',              CURRENT_TIMESTAMP),
  ('pricing.vip.amount',      '15000', 'pricing',  'Prix VIP (FCFA)',                    CURRENT_TIMESTAMP),
  ('pricing.vip.days',        '30',    'pricing',  'Durée VIP (jours)',                  CURRENT_TIMESTAMP),
  ('referral.bonus.signup',   '500',   'referral', 'Bonus parrainage à l''inscription',  CURRENT_TIMESTAMP),
  ('referral.bonus.payment',  '2000',  'referral', 'Bonus parrainage au 1er paiement',   CURRENT_TIMESTAMP),
  ('withdrawal.min',          '5000',  'limits',   'Retrait minimum (FCFA)',             CURRENT_TIMESTAMP),
  ('withdrawal.fee.percent',  '2',     'limits',   'Frais de retrait (%)',               CURRENT_TIMESTAMP),
  ('deposit.min',             '500',   'limits',   'Dépôt minimum (FCFA)',               CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
