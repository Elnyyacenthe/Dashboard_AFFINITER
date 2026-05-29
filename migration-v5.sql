-- ============================================================
-- Migration v5 — Phase 2B monétisation
-- Diamond tier, Service photos, Auto-renewal, Support tickets
-- À exécuter APRÈS migration-v4.sql
-- ============================================================

-- ============================================================
-- 1. AdTier — ajout DIAMOND
-- ============================================================
ALTER TYPE "AdTier" ADD VALUE IF NOT EXISTS 'DIAMOND';

-- ============================================================
-- 2. Ad — Auto-renewal
-- ============================================================
ALTER TABLE "Ad"
  ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Ad_autoRenew_promotedUntil_idx"
  ON "Ad"("autoRenew", "promotedUntil")
  WHERE "autoRenew" = true;

-- ============================================================
-- 3. Media — photos de service (payantes)
-- ============================================================
ALTER TABLE "Media"
  ADD COLUMN IF NOT EXISTS "isServicePhoto" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "paymentId"      TEXT;

CREATE INDEX IF NOT EXISTS "Media_isServicePhoto_idx" ON "Media"("isServicePhoto");

-- ============================================================
-- 4. Support tickets (I12)
-- ============================================================
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'CLOSED');
CREATE TYPE "TicketCategory" AS ENUM ('GENERAL', 'PAYMENT', 'MODERATION', 'KYC', 'BUG', 'OTHER');

CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "category"  "TicketCategory" NOT NULL DEFAULT 'GENERAL',
  "status"    "TicketStatus"   NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_updatedAt_idx" ON "SupportTicket"("status", "updatedAt" DESC);

ALTER TABLE "SupportTicket"
  ADD CONSTRAINT "SupportTicket_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SupportMessage" (
  "id"        TEXT PRIMARY KEY,
  "ticketId"  TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "isAdmin"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SupportMessage_ticketId_createdAt_idx"
  ON "SupportMessage"("ticketId", "createdAt");

ALTER TABLE "SupportMessage"
  ADD CONSTRAINT "SupportMessage_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportMessage"
  ADD CONSTRAINT "SupportMessage_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 5. Nouveaux réglages tarifaires
-- ============================================================
INSERT INTO "SiteSetting" ("key", "value", "category", "label", "updatedAt") VALUES
  ('pricing.diamond.amount',         '50000', 'pricing', 'Prix Diamond / 30j (1 slot par ville)',  CURRENT_TIMESTAMP),
  ('pricing.diamond.days',           '30',    'pricing', 'Durée Diamond (jours)',                  CURRENT_TIMESTAMP),
  ('pricing.servicePhoto.amount',    '300',   'pricing', 'Prix photo service (par publication)',   CURRENT_TIMESTAMP),
  ('autoRenew.tryBefore.hours',      '12',    'limits',  'Tentative auto-renew X heures avant fin',CURRENT_TIMESTAMP),
  ('autoRenew.maxRetries',           '3',     'limits',  'Tentatives max d''auto-renouvellement',  CURRENT_TIMESTAMP),
  ('autoSuggest.minViewsForUpgrade', '10',    'limits',  'Vues quotidiennes pour suggérer upgrade',CURRENT_TIMESTAMP),
  ('alerts.revenue.daily.threshold', '20000', 'limits',  'Seuil revenu quotidien (alerte admin si <)', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
